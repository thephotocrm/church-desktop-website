import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";

const router = Router();

// Validation schema for ingest payload
const ingestSchema = z.object({
  title: z.string().min(1),
  r2Key: z.string().min(1),
  r2Url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
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

export default router;
