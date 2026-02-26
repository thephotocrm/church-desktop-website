import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { Readable } from "stream";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { uploadBuffer } from "../r2";
import sharp from "sharp";
import { generatePastorTitleProgrammatic, generateServiceOverlay, generateTitleColoredBg, TEXT_STYLES } from "../thumbnailGenerator";

const router = Router();

// Validation schema for ingest payload
const ingestSchema = z.object({
  title: z.string().min(1),
  r2Key: z.string().min(1),
  r2Url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  thumbnailCandidates: z.array(z.string().url()).optional(),
  duration: z.number().int().min(0).optional(),
  fileSize: z.number().int().min(0).optional(),
  streamStartedAt: z.string().optional(),
});

// POST /api/recordings/ingest — called by VPS upload script
router.post("/ingest", async (req, res) => {
  const secret = req.headers["x-ingest-secret"] as string | undefined;
  const expectedSecret = process.env.RECORDING_INGEST_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(403).json({ error: "Invalid ingest secret" });
  }

  const parsed = ingestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const data = parsed.data;

    const recording = await storage.createRecording({
      title: data.title,
      r2Key: data.r2Key,
      r2Url: data.r2Url,
      thumbnailUrl: data.thumbnailUrl || null,
      thumbnailCandidates: data.thumbnailCandidates || [],
      duration: data.duration ?? null,
      fileSize: data.fileSize ?? null,
      status: "ready",
      published: false,
      streamStartedAt: data.streamStartedAt ? new Date(data.streamStartedAt) : new Date(),
    });

    console.log(`[Ingest] Recording created: ${recording.id} — ${data.title}`);
    res.status(201).json(recording);
  } catch (err) {
    console.error("[Ingest] Error creating recording:", err);
    res.status(500).json({ error: "Failed to create recording" });
  }
});

// GET /api/recordings?limit=12&offset=0 — public, paginated
router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  try {
    const result = await storage.getRecordings(limit, offset);
    res.json(result);
  } catch (err) {
    console.error("[Recordings] Error fetching recordings:", err);
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
});

// POST /api/recordings/admin/upload-thumbnail — admin: upload a custom thumbnail image
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|png|gif|webp)$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed"));
    }
  },
});

router.post("/admin/upload-thumbnail", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large (max 5 MB)" });
      }
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const key = `thumbnails/custom/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const url = await uploadBuffer(req.file.buffer, key, req.file.mimetype);

    console.log(`[Admin] Thumbnail uploaded: ${key}`);
    res.json({ url });
  } catch (err) {
    console.error("[Admin] Error uploading thumbnail:", err);
    res.status(500).json({ error: "Failed to upload thumbnail" });
  }
});

// Helper: run tasks with concurrency limit
async function parallelWithLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIdx = 0;

  async function worker() {
    while (nextIdx < tasks.length) {
      const idx = nextIdx++;
      try {
        const value = await tasks[idx]();
        results[idx] = { status: "fulfilled", value };
      } catch (reason: any) {
        results[idx] = { status: "rejected", reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// POST /api/recordings/admin/generate-thumbnail-batch — admin: batch generate thumbnails across all modes
const batchGenerateSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  pastorImageUrl: z.string().optional(),
  pastorLayout: z.enum(["left", "right"]).optional(),
  snapshotUrl: z.string().optional(),
  count: z.number().int().min(1).max(50).optional().default(25),
});

router.post("/admin/generate-thumbnail-batch", requireAuth, async (req, res) => {
  const parsed = batchGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const { title, subtitle, pastorImageUrl, snapshotUrl, count } = parsed.data;

    // Determine available modes
    const modes: string[] = ["title-background"]; // always available
    if (pastorImageUrl) modes.push("pastor-title");
    if (snapshotUrl) modes.push("service-overlay");

    // Pre-process snapshot once if needed (may remove service-overlay from modes if invalid)
    let snapshotBuffer: Buffer | undefined;
    if (snapshotUrl && modes.includes("service-overlay")) {
      if (snapshotUrl.startsWith("data:")) {
        const base64Match = snapshotUrl.match(/^data:[^;]+;base64,(.+)$/);
        if (!base64Match) {
          return res.status(400).json({ error: "Invalid snapshot data URL" });
        }
        snapshotBuffer = Buffer.from(base64Match[1], "base64");
        console.log(`[Admin] Snapshot from data URL: ${snapshotBuffer.length} bytes`);
      } else {
        console.log(`[Admin] Fetching snapshot from URL: ${snapshotUrl.slice(0, 120)}...`);
        const response = await fetch(snapshotUrl);
        if (!response.ok) {
          console.error(`[Admin] Snapshot fetch failed: ${response.status} ${response.statusText}`);
          return res.status(400).json({ error: `Failed to download snapshot: ${response.status}` });
        }
        const contentType = response.headers.get("content-type") || "";
        snapshotBuffer = Buffer.from(await response.arrayBuffer());
        console.log(`[Admin] Snapshot downloaded: ${snapshotBuffer.length} bytes, content-type: ${contentType}`);
        // If R2 returned an HTML error page or non-image, skip service-overlay
        if (!contentType.startsWith("image/") && snapshotBuffer.length < 1000) {
          console.error(`[Admin] Snapshot is not an image (content-type: ${contentType}), disabling service-overlay`);
          snapshotBuffer = undefined;
          // Remove service-overlay from modes
          const idx = modes.indexOf("service-overlay");
          if (idx >= 0) modes.splice(idx, 1);
        }
      }
      // Validate the buffer is a real image
      if (snapshotBuffer) {
        try {
          const meta = await sharp(snapshotBuffer).metadata();
          console.log(`[Admin] Snapshot validated: ${meta.width}x${meta.height}, format=${meta.format}`);
        } catch (e: any) {
          console.error(`[Admin] Snapshot buffer is not a valid image: ${e.message}`);
          snapshotBuffer = undefined;
          const idx = modes.indexOf("service-overlay");
          if (idx >= 0) modes.splice(idx, 1);
        }
      }
    }

    // Distribute count evenly across (validated) modes
    const perMode = Math.floor(count / modes.length);
    const remainder = count % modes.length;
    const distribution: { mode: string; count: number }[] = modes.map((mode, i) => ({
      mode,
      count: perMode + (i < remainder ? 1 : 0),
    }));

    // Pre-assign unique style indices — shuffle ALL styles then pick `count`,
    // so we sample from the full range (not just indices 0..count-1 which
    // cluster in the same font families like Oswald/Playfair/Montserrat).
    const styleCount = TEXT_STYLES.length;
    const allStyleIndices = Array.from({ length: styleCount }, (_, i) => i);
    // Fisher-Yates shuffle the full array
    for (let i = allStyleIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allStyleIndices[i], allStyleIndices[j]] = [allStyleIndices[j], allStyleIndices[i]];
    }
    // Take first `count` (or wrap if count > styleCount)
    const styleIndices: number[] = [];
    for (let i = 0; i < count; i++) styleIndices.push(allStyleIndices[i % styleCount]);

    // Build task list — interleave modes for a mixed grid
    type TaskDef = { mode: string; styleIdx: number; layout: "left" | "right" };
    const taskDefs: TaskDef[] = [];
    const modeCounts = new Map(distribution.map(d => [d.mode, d.count]));
    let totalAssigned = 0;
    // Round-robin across modes for interleaving
    let assigned = true;
    while (assigned) {
      assigned = false;
      for (const mode of modes) {
        const remaining = modeCounts.get(mode)!;
        if (remaining > 0) {
          modeCounts.set(mode, remaining - 1);
          const layout: "left" | "right" = mode === "pastor-title"
            ? (Math.random() < 0.5 ? "left" : "right")
            : "right";
          taskDefs.push({ mode, styleIdx: styleIndices[totalAssigned], layout });
          totalAssigned++;
          assigned = true;
        }
      }
    }

    const tasks: (() => Promise<{ url: string; mode: string }>)[] = taskDefs.map((def) => {
      return async () => {
        let thumbnailBuffer: Buffer;
        switch (def.mode) {
          case "pastor-title":
            thumbnailBuffer = await generatePastorTitleProgrammatic(
              pastorImageUrl!,
              title,
              def.layout,
              subtitle,
              def.styleIdx
            );
            break;
          case "service-overlay":
            // Copy buffer for each concurrent call to be safe
            thumbnailBuffer = await generateServiceOverlay(
              Buffer.from(snapshotBuffer!),
              title,
              subtitle,
              def.styleIdx
            );
            break;
          case "title-background":
          default:
            thumbnailBuffer = await generateTitleColoredBg(title, subtitle, def.styleIdx);
            break;
        }
        const key = `thumbnails/ai/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
        const url = await uploadBuffer(thumbnailBuffer, key, "image/jpeg");
        return { url, mode: def.mode };
      };
    });

    console.log(`[Admin] Batch generating ${tasks.length} thumbnails across modes: ${modes.join(", ")}`);
    const results = await parallelWithLimit(tasks, 5);

    const thumbnails: { url: string; mode: string }[] = [];
    let errors = 0;
    for (const result of results) {
      if (result.status === "fulfilled") {
        thumbnails.push(result.value);
      } else {
        errors++;
        console.error("[Admin] Batch thumbnail error:", result.reason?.message || result.reason);
      }
    }

    console.log(`[Admin] Batch complete: ${thumbnails.length} succeeded, ${errors} errors`);
    res.json({ thumbnails, errors });
  } catch (err: any) {
    console.error("[Admin] Error in batch generation:", err);
    res.status(500).json({ error: err.message || "Failed to generate thumbnails" });
  }
});

// POST /api/recordings/admin/generate-thumbnail — admin: AI-generated YouTube-style thumbnail
const generateThumbnailSchema = z.object({
  mode: z.enum(["pastor-title", "service-overlay", "title-background"]),
  snapshotUrl: z.string().nullable().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  maskDataUrl: z.string().optional(),
  pastorImageUrl: z.string().url().optional(),
  layout: z.enum(["left", "right"]).optional(),
});

router.post("/admin/generate-thumbnail", requireAuth, async (req, res) => {
  const parsed = generateThumbnailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const { mode, snapshotUrl, title, subtitle, maskDataUrl } = parsed.data;

    let thumbnailBuffer: Buffer;

    switch (mode) {
      case "pastor-title": {
        if (!parsed.data.pastorImageUrl) {
          return res.status(400).json({ error: "Pastor image URL is required for pastor-title mode" });
        }
        if (!parsed.data.layout) {
          return res.status(400).json({ error: "Layout (left/right) is required for pastor-title mode" });
        }
        console.log(`[Admin] Generating programmatic pastor-title thumbnail for: "${title}"${subtitle ? ` / "${subtitle}"` : ""} (layout=${parsed.data.layout})`);
        thumbnailBuffer = await generatePastorTitleProgrammatic(parsed.data.pastorImageUrl, title, parsed.data.layout, subtitle);
        break;
      }
      case "service-overlay": {
        if (!snapshotUrl) {
          return res.status(400).json({ error: "Snapshot URL is required for service-overlay mode" });
        }
        let snapshotBuffer: Buffer;
        if (snapshotUrl.startsWith("data:")) {
          // Data URL from canvas capture — decode directly (no R2 round-trip)
          const base64Match = snapshotUrl.match(/^data:[^;]+;base64,(.+)$/);
          if (!base64Match) {
            return res.status(400).json({ error: "Invalid snapshot data URL" });
          }
          snapshotBuffer = Buffer.from(base64Match[1], "base64");
          console.log(`[Admin] Service-overlay snapshot from data URL: ${snapshotBuffer.length} bytes`);
        } else {
          const response = await fetch(snapshotUrl);
          if (!response.ok) {
            return res.status(400).json({ error: `Failed to download snapshot: ${response.status}` });
          }
          snapshotBuffer = Buffer.from(await response.arrayBuffer());
          console.log(`[Admin] Service-overlay snapshot downloaded: ${snapshotBuffer.length} bytes`);
        }
        try {
          const meta = await sharp(snapshotBuffer).metadata();
          console.log(`[Admin] Snapshot image: ${meta.width}x${meta.height}, format=${meta.format}, channels=${meta.channels}`);
        } catch (e: any) {
          console.log(`[Admin] WARNING: Could not read snapshot metadata: ${e.message}`);
        }
        console.log(`[Admin] Generating service-overlay thumbnail for: "${title}"${subtitle ? ` / "${subtitle}"` : ""}`);
        thumbnailBuffer = await generateServiceOverlay(snapshotBuffer, title, subtitle);
        break;
      }
      case "title-background": {
        console.log(`[Admin] Generating title-background thumbnail for: "${title}"${subtitle ? ` / "${subtitle}"` : ""}`);
        thumbnailBuffer = await generateTitleColoredBg(title, subtitle);
        break;
      }
    }

    // Upload to R2
    const key = `thumbnails/ai/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
    const url = await uploadBuffer(thumbnailBuffer, key, "image/jpeg");

    console.log(`[Admin] AI thumbnail generated and uploaded: ${key}`);
    res.json({ url });
  } catch (err: any) {
    console.error("[Admin] Error generating AI thumbnail:", err);
    const message = err.message || "Failed to generate thumbnail";
    res.status(500).json({ error: message });
  }
});

// --- Temporary test endpoints (no auth) for thumbnail preview ---
// In-memory store so we skip R2 entirely for this test page
const testPastorImages = new Map<string, { buffer: Buffer; mime: string }>();
const testSnapshotImages = new Map<string, { buffer: Buffer; mime: string }>();

router.post("/test/upload-pastor", (req, res, next) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large (max 5 MB)" });
      }
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const id = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    testPastorImages.set(id, { buffer: req.file.buffer, mime: req.file.mimetype });
    const url = `/api/recordings/test/pastor-image/${id}`;
    console.log(`[Test] Pastor image stored in-memory: ${id} (${req.file.buffer.length} bytes)`);
    res.json({ url, id });
  } catch (err) {
    console.error("[Test] Error uploading pastor image:", err);
    res.status(500).json({ error: "Failed to upload" });
  }
});

router.get("/test/pastor-image/:id", (req, res) => {
  const entry = testPastorImages.get(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "Image not found" });
  }
  res.setHeader("Content-Type", entry.mime);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(entry.buffer);
});

router.post("/test/upload-snapshot", (req, res, next) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large (max 5 MB)" });
      }
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    const id = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    testSnapshotImages.set(id, { buffer: req.file.buffer, mime: req.file.mimetype });
    const url = `/api/recordings/test/snapshot-image/${id}`;
    console.log(`[Test] Snapshot image stored in-memory: ${id} (${req.file.buffer.length} bytes)`);
    res.json({ url, id });
  } catch (err) {
    console.error("[Test] Error uploading snapshot image:", err);
    res.status(500).json({ error: "Failed to upload" });
  }
});

router.get("/test/snapshot-image/:id", (req, res) => {
  const entry = testSnapshotImages.get(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "Image not found" });
  }
  res.setHeader("Content-Type", entry.mime);
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(entry.buffer);
});

// GET /api/recordings/test/styles — list all available text styles
router.get("/test/styles", (_req, res) => {
  res.json({
    count: TEXT_STYLES.length,
    styles: TEXT_STYLES.map((s, i) => ({ index: i, name: s.name, fontFamily: s.fontFamily, subtitleFontFamily: s.subtitleFontFamily })),
  });
});

const testGenerateSchema = z.object({
  mode: z.enum(["pastor-title", "title-background", "service-overlay"]),
  pastorImageId: z.string().optional(),
  snapshotImageId: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  layout: z.enum(["left", "right"]).optional(),
  styleIndex: z.number().int().min(0).optional(),
});

router.post("/test/generate-thumbnail", async (req, res) => {
  const parsed = testGenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }
  try {
    const { mode, title, subtitle, styleIndex } = parsed.data;
    let thumbnailBuffer: Buffer;

    switch (mode) {
      case "pastor-title": {
        const { pastorImageId, layout } = parsed.data;
        if (!pastorImageId) {
          return res.status(400).json({ error: "Pastor image is required for pastor-title mode" });
        }
        if (!layout) {
          return res.status(400).json({ error: "Layout is required for pastor-title mode" });
        }
        const entry = testPastorImages.get(pastorImageId);
        if (!entry) {
          return res.status(400).json({ error: "Pastor image not found — re-upload it" });
        }
        const dataUrl = `data:${entry.mime};base64,${entry.buffer.toString("base64")}`;
        console.log(`[Test] Generating pastor-title thumbnail for: "${title}" (style: ${styleIndex ?? "random"})`);
        thumbnailBuffer = await generatePastorTitleProgrammatic(dataUrl, title, layout, subtitle, styleIndex);
        break;
      }
      case "title-background": {
        console.log(`[Test] Generating title-background thumbnail for: "${title}" (style: ${styleIndex ?? "random"})`);
        thumbnailBuffer = await generateTitleColoredBg(title, subtitle, styleIndex);
        break;
      }
      case "service-overlay": {
        const { snapshotImageId } = parsed.data;
        if (!snapshotImageId) {
          return res.status(400).json({ error: "Snapshot image is required for service-overlay mode" });
        }
        const entry = testSnapshotImages.get(snapshotImageId);
        if (!entry) {
          return res.status(400).json({ error: "Snapshot image not found — re-upload it" });
        }
        console.log(`[Test] Generating service-overlay thumbnail for: "${title}" (style: ${styleIndex ?? "random"})`);
        thumbnailBuffer = await generateServiceOverlay(entry.buffer, title, subtitle, styleIndex);
        break;
      }
    }

    const url = `data:image/jpeg;base64,${thumbnailBuffer.toString("base64")}`;
    console.log(`[Test] Thumbnail generated (${thumbnailBuffer.length} bytes)`);
    res.json({ url });
  } catch (err: any) {
    console.error("[Test] Error generating thumbnail:", err);
    res.status(500).json({ error: err.message || "Failed to generate thumbnail" });
  }
});

// POST /api/recordings/admin/import-style-references — one-time import of Elevation Church thumbnails
router.post("/admin/import-style-references", requireAuth, async (req, res) => {
  const VIDEO_IDS = [
    "azBTYPEM2mM", "57LVVwba6_8", "72AWy48vDcE", "aJE6iwQeIq0", "Qq6h-oZSSG4",
    "mc79lzyrG7o", "RCJGFhj6-2o", "eyYgG56YJVY", "-3LoxiCBGzI", "DheGme_pzd0",
    "7HLW6Qbfv6s", "EFfoJdV8QLk", "y4y_B0khuWo", "9U8UJReHPNI", "jROl4hLXzKA",
    "Ap-SCgWbKtI", "8wFEr-jtwDI", "2OxoBLOQyrc", "DtZDArENC8k", "f6S3Mml9kFo",
  ];

  let imported = 0, skipped = 0, failed = 0, shorts = 0;

  // Get existing references to skip duplicates
  const existing = await storage.getAllStyleReferences();
  const existingVideoIds = new Set(existing.map(r => r.sourceVideoId));

  for (const videoId of VIDEO_IDS) {
    if (existingVideoIds.has(videoId)) {
      skipped++;
      continue;
    }

    try {
      // Check oEmbed to filter out shorts/vertical videos
      let videoLabel = `Elevation Church - ${videoId}`;
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!oembedRes.ok) {
          console.warn(`[StyleRef] oEmbed failed for ${videoId} (${oembedRes.status}), skipping`);
          shorts++;
          continue;
        }
        const oembed = await oembedRes.json() as { width?: number; height?: number; title?: string };
        if (oembed.height && oembed.width && oembed.height > oembed.width) {
          console.log(`[StyleRef] Skipping short/vertical video ${videoId}`);
          shorts++;
          continue;
        }
        if (oembed.title) {
          videoLabel = oembed.title;
        }
      } catch {
        console.warn(`[StyleRef] oEmbed error for ${videoId}, skipping`);
        shorts++;
        continue;
      }

      // Try maxresdefault first, fall back to sddefault
      let imgUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      let imgRes = await fetch(imgUrl);

      // maxresdefault returns a small placeholder if not available (check content-length)
      if (!imgRes.ok || (imgRes.headers.get("content-length") && parseInt(imgRes.headers.get("content-length")!) < 5000)) {
        imgUrl = `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
        imgRes = await fetch(imgUrl);
      }

      if (!imgRes.ok) {
        console.error(`[StyleRef] Failed to fetch thumbnail for ${videoId}: ${imgRes.status}`);
        failed++;
        continue;
      }

      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const r2Key = `style-references/${videoId}.jpg`;
      const r2Url = await uploadBuffer(imgBuffer, r2Key, "image/jpeg");

      await storage.createStyleReference({
        sourceVideoId: videoId,
        r2Key,
        r2Url,
        label: videoLabel,
        isActive: true,
        category: "pastor-title",
      });

      imported++;
      console.log(`[StyleRef] Imported ${videoId}: ${videoLabel}`);
    } catch (err) {
      console.error(`[StyleRef] Error importing ${videoId}:`, err);
      failed++;
    }
  }

  console.log(`[StyleRef] Import complete: ${imported} imported, ${skipped} skipped, ${shorts} shorts filtered, ${failed} failed`);
  res.json({ imported, skipped, failed, shorts });
});

// GET /api/recordings/admin/style-references — list all style references
router.get("/admin/style-references", requireAuth, async (_req, res) => {
  try {
    const refs = await storage.getAllStyleReferences();
    res.json(refs);
  } catch (err) {
    console.error("[StyleRef] Error fetching style references:", err);
    res.status(500).json({ error: "Failed to fetch style references" });
  }
});

// DELETE /api/recordings/admin/style-references/:id — remove a style reference
router.delete("/admin/style-references/:id", requireAuth, async (req, res) => {
  try {
    await storage.deleteStyleReference(req.params.id as string);
    res.json({ success: true });
  } catch (err) {
    console.error("[StyleRef] Error deleting style reference:", err);
    res.status(500).json({ error: "Failed to delete style reference" });
  }
});

// GET /api/recordings/admin/all — admin: all recordings (any status)
router.get("/admin/all", requireAuth, async (req, res) => {
  try {
    const items = await storage.getAllRecordings();
    res.json(items);
  } catch (err) {
    console.error("[Recordings] Error fetching all recordings:", err);
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
});

// GET /api/recordings/:id/video — proxy R2 video as same-origin (enables canvas capture)
router.get("/:id/video", async (req, res) => {
  try {
    const recording = await storage.getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "Not found" });

    // Forward Range header for seeking support
    const headers: Record<string, string> = {};
    if (req.headers.range) headers["Range"] = req.headers.range;

    const r2Res = await fetch(recording.r2Url, { headers });
    if (!r2Res.ok && r2Res.status !== 206) {
      return res.status(r2Res.status).end();
    }

    // Forward critical headers
    res.status(r2Res.status);
    for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
      const v = r2Res.headers.get(h);
      if (v) res.setHeader(h, v);
    }

    // Pipe the body without buffering
    Readable.fromWeb(r2Res.body as any).pipe(res);
  } catch (err) {
    console.error("[VideoProxy] Error:", err);
    res.status(500).json({ error: "Failed to proxy video" });
  }
});

// GET /api/recordings/:id — single recording
router.get("/:id", async (req, res) => {
  try {
    const recording = await storage.getRecording(req.params.id);
    if (!recording) {
      return res.status(404).json({ error: "Recording not found" });
    }
    res.json(recording);
  } catch (err) {
    console.error("[Recordings] Error fetching recording:", err);
    res.status(500).json({ error: "Failed to fetch recording" });
  }
});

// PATCH /api/recordings/admin/:id — admin: update recording metadata
const updateRecordingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  status: z.enum(["processing", "ready", "error"]).optional(),
  published: z.boolean().optional(),
});

router.patch("/admin/:id", requireAuth, async (req, res) => {
  const parsed = updateRecordingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  try {
    const id = req.params.id as string;
    const existing = await storage.getRecording(id);
    if (!existing) {
      return res.status(404).json({ error: "Recording not found" });
    }

    const recording = await storage.updateRecording(id, parsed.data);
    console.log(`[Admin] Recording updated: ${recording.id}`);
    res.json(recording);
  } catch (err) {
    console.error("[Admin] Error updating recording:", err);
    res.status(500).json({ error: "Failed to update recording" });
  }
});

// DELETE /api/recordings/admin/:id — admin: delete recording
router.delete("/admin/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const existing = await storage.getRecording(id);
    if (!existing) {
      return res.status(404).json({ error: "Recording not found" });
    }

    await storage.deleteRecording(id);
    console.log(`[Admin] Recording deleted: ${id} — ${existing.title}`);
    res.json({ success: true });
  } catch (err) {
    console.error("[Admin] Error deleting recording:", err);
    res.status(500).json({ error: "Failed to delete recording" });
  }
});

export default router;
