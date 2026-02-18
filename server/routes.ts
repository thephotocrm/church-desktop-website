import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, updateStreamConfigSchema } from "@shared/schema";

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

  // GET /api/stream/status - public endpoint for stream status
  app.get("/api/stream/status", async (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const config = await storage.getStreamConfig();
    if (!config) {
      return res.json({
        isLive: false,
        title: "Sunday Worship Service",
        description: null,
        hlsUrl: null,
        thumbnailUrl: null,
        startedAt: null,
      });
    }
    const hlsUrl = config.isLive
      ? (config.hlsUrl || process.env.STREAM_HLS_URL || null)
      : null;
    res.json({
      isLive: config.isLive,
      title: config.title,
      description: config.description,
      hlsUrl,
      thumbnailUrl: config.thumbnailUrl,
      startedAt: config.startedAt,
    });
  });

  // PATCH /api/stream/status - admin endpoint to update stream status
  app.patch("/api/stream/status", async (req, res) => {
    const parsed = updateStreamConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const updates: Record<string, unknown> = { ...parsed.data };

    // Auto-set startedAt when going live, clear when going offline
    if (parsed.data.isLive === true) {
      updates.startedAt = new Date();
    } else if (parsed.data.isLive === false) {
      updates.startedAt = null;
    }

    const config = await storage.updateStreamConfig(updates);
    res.json(config);
  });

  // CORS preflight for stream status (mobile app)
  app.options("/api/stream/status", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  return httpServer;
}
