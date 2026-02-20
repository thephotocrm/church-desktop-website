import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { encrypt, mask, isEncrypted } from "../encryption";

const router = Router();

// GET /api/admin/platform-configs - returns configs with masked keys
router.get("/platform-configs", requireAuth, async (_req, res) => {
  try {
    const configs = await storage.getPlatformConfigs();
    const masked = configs.map((c) => ({
      ...c,
      streamKey: mask(c.streamKey),
      apiKey: mask(c.apiKey),
    }));
    res.json(masked);
  } catch (err) {
    console.error("Error fetching platform configs:", err);
    res.status(500).json({ error: "Failed to fetch platform configs" });
  }
});

// PATCH /api/admin/platform-configs/:platform - updates config, encrypts new keys
router.patch("/platform-configs/:platform", requireAuth, async (req, res) => {
  const { platform } = req.params;
  if (platform !== "youtube" && platform !== "facebook") {
    return res.status(400).json({ error: "Invalid platform. Must be 'youtube' or 'facebook'" });
  }

  try {
    const { enabled, streamKey, rtmpUrl, channelId, apiKey, channelUrl } = req.body;
    const updates: Record<string, unknown> = {};

    if (enabled !== undefined) updates.enabled = enabled;
    if (rtmpUrl !== undefined) updates.rtmpUrl = rtmpUrl;
    if (channelId !== undefined) updates.channelId = channelId;
    if (channelUrl !== undefined) updates.channelUrl = channelUrl;

    // Encrypt stream key if provided and not already masked/encrypted
    if (streamKey !== undefined && streamKey !== null) {
      if (streamKey.startsWith("****")) {
        // User didn't change the masked value — skip
      } else {
        updates.streamKey = encrypt(streamKey);
      }
    }

    // Encrypt API key if provided
    if (apiKey !== undefined && apiKey !== null) {
      if (apiKey.startsWith("****")) {
        // User didn't change the masked value — skip
      } else {
        updates.apiKey = encrypt(apiKey);
      }
    }

    const config = await storage.upsertPlatformConfig(platform, updates);
    res.json({
      ...config,
      streamKey: mask(config.streamKey),
      apiKey: mask(config.apiKey),
    });
  } catch (err) {
    console.error("Error updating platform config:", err);
    res.status(500).json({ error: "Failed to update platform config" });
  }
});

// GET /api/admin/restream-status - returns per-platform status
router.get("/restream-status", requireAuth, async (_req, res) => {
  try {
    const statuses = await storage.getRestreamStatuses();
    res.json(statuses);
  } catch (err) {
    console.error("Error fetching restream status:", err);
    res.status(500).json({ error: "Failed to fetch restream status" });
  }
});

export default router;
