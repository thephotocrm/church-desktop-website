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
import { generatePastorTitleProgrammatic, generateServiceOverlay, generateTitleColoredBg } from "../thumbnailGenerator";

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

// POST /api/recordings/admin/generate-thumbnail — admin: AI-generated YouTube-style thumbnail
const generateThumbnailSchema = z.object({
  mode: z.enum(["pastor-title", "service-overlay", "title-background"]),
  snapshotUrl: z.string().url().nullable().optional(),
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
        const response = await fetch(snapshotUrl);
        if (!response.ok) {
          return res.status(400).json({ error: `Failed to download snapshot: ${response.status}` });
        }
        const snapshotBuffer = Buffer.from(await response.arrayBuffer());
        console.log(`[Admin] Service-overlay snapshot downloaded: ${snapshotBuffer.length} bytes`);
        try {
          const meta = await sharp(snapshotBuffer).metadata();
          console.log(`[Admin] Snapshot image: ${meta.width}x${meta.height}, format=${meta.format}, channels=${meta.channels}`);
        } catch (e: any) {
          console.log(`[Admin] WARNING: Could not read snapshot metadata: ${e.message}`);
        }
        console.log(`[Admin] Generating service-overlay thumbnail for: "${title}"`);
        thumbnailBuffer = await generateServiceOverlay(snapshotBuffer, title);
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
    const ext = path.extname(req.file.originalname).toLowerCase() || ".png";
    const key = `thumbnails/test/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const url = await uploadBuffer(req.file.buffer, key, req.file.mimetype);
    res.json({ url });
  } catch (err) {
    console.error("[Test] Error uploading pastor image:", err);
    res.status(500).json({ error: "Failed to upload" });
  }
});

router.post("/test/generate-thumbnail", async (req, res) => {
  const parsed = generateThumbnailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }
  try {
    const { title, subtitle } = parsed.data;
    if (!parsed.data.pastorImageUrl || !parsed.data.layout) {
      return res.status(400).json({ error: "pastorImageUrl and layout required" });
    }
    console.log(`[Test] Generating pastor-title thumbnail for: "${title}"`);
    const thumbnailBuffer = await generatePastorTitleProgrammatic(parsed.data.pastorImageUrl, title, parsed.data.layout, subtitle);
    const key = `thumbnails/test/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
    const url = await uploadBuffer(thumbnailBuffer, key, "image/jpeg");
    console.log(`[Test] Thumbnail generated: ${key}`);
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
