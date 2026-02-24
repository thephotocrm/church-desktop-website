import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../auth";

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
  description: z.string().optional(),
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
