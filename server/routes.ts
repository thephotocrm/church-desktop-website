import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import { insertContactSchema, updateStreamConfigSchema } from "@shared/schema";
import memberRoutes from "./routes/memberRoutes";
import groupRoutes from "./routes/groupRoutes";
import prayerRoutes from "./routes/prayerRoutes";
import givingRoutes from "./routes/givingRoutes";

// MediaMTX base URL (protocol + host + port)
const MEDIA_SERVER_BASE = process.env.STREAM_HLS_URL
  ? process.env.STREAM_HLS_URL.substring(0, process.env.STREAM_HLS_URL.indexOf("/", 8)) // strip path
  : "http://129.212.184.68:8888";

const HLS_CHECK_URL = process.env.STREAM_HLS_URL || "http://129.212.184.68:8888/live/live/index.m3u8";

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

  let isLive = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(HLS_CHECK_URL, {
      method: "GET",
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

    // Return proxied URL so the browser stays on HTTPS (no mixed content)
    const hlsUrl = isLive
      ? "/api/stream/hls/live/live/index.m3u8"
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

  // HLS proxy — serves MediaMTX content through the same origin to avoid mixed content
  app.get("/api/stream/hls/{*path}", async (req, res) => {
    const rawPath = (req.params as Record<string, string | string[]>).path;
    const subPath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;
    const targetUrl = `${MEDIA_SERVER_BASE}/${subPath}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(response.status).end();
      }

      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache");

      const body = await response.arrayBuffer();
      res.send(Buffer.from(body));
    } catch {
      res.status(502).end();
    }
  });

  // CORS preflight for stream endpoints
  app.options("/api/stream/status", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  app.options("/api/stream/hls/{*path}", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  // New feature routes
  app.use("/api/members", memberRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/prayer-requests", prayerRoutes);
  app.use("/api/giving", givingRoutes);

  // Config endpoint (public - returns Stripe publishable key)
  app.get("/api/config", (_req, res) => {
    res.json({
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    });
  });

  return httpServer;
}
