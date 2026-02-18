import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import { insertContactSchema, updateStreamConfigSchema } from "@shared/schema";

// Stream auto-detection cache
let streamCache: { isLive: boolean; checkedAt: number } = {
  isLive: false,
  checkedAt: 0,
};
const CACHE_TTL_MS = 5000; // 5 seconds
let wasLive = false; // track previous state for startedAt transitions

async function checkStreamLive(): Promise<boolean> {
  const now = Date.now();
  if (now - streamCache.checkedAt < CACHE_TTL_MS) {
    return streamCache.isLive;
  }

  const hlsUrl = process.env.STREAM_HLS_URL || "http://129.212.184.68:8888/live/index.m3u8";
  let isLive = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(hlsUrl, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    isLive = response.ok;
  } catch {
    isLive = false;
  }

  // Handle startedAt transitions
  if (isLive && !wasLive) {
    // Transitioning from offline -> live
    await storage.updateStreamConfig({ isLive: true, startedAt: new Date() });
  } else if (!isLive && wasLive) {
    // Transitioning from live -> offline
    await storage.updateStreamConfig({ isLive: false, startedAt: null });
  }

  wasLive = isLive;
  streamCache = { isLive, checkedAt: now };
  return isLive;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/events", async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get("/api/leaders", async (_req, res) => {
    const leaders = await storage.getLeaders();
    res.json(leaders);
  });

  app.get("/api/ministries", async (_req, res) => {
    const ministries = await storage.getMinistries();
    res.json(ministries);
  });

  app.post("/api/contact", async (req, res) => {
    const parsed = insertContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const contact = await storage.createContact(parsed.data);
    res.status(201).json(contact);
  });

  // GET /api/stream/status - public endpoint with auto-detection
  app.get("/api/stream/status", async (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const isLive = await checkStreamLive();
    const config = await storage.getStreamConfig();

    const hlsUrl = isLive
      ? (process.env.STREAM_HLS_URL || "http://129.212.184.68:8888/live/index.m3u8")
      : null;

    res.json({
      isLive,
      title: config?.title || "Sunday Worship Service",
      description: config?.description || null,
      hlsUrl,
      thumbnailUrl: config?.thumbnailUrl || null,
      startedAt: isLive ? config?.startedAt : null,
    });
  });

  // PATCH /api/stream/config - protected endpoint to update stream settings
  app.patch("/api/stream/config", requireAuth, async (req, res) => {
    const parsed = updateStreamConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    // Only allow updating title, description, thumbnailUrl — not isLive (auto-detected)
    const { title, description, thumbnailUrl } = parsed.data;
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;

    const config = await storage.updateStreamConfig(updates);
    res.json(config);
  });

  // CORS preflight for stream endpoints
  app.options("/api/stream/status", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  return httpServer;
}
