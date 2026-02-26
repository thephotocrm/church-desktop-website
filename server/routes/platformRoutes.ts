import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { encrypt, decrypt, mask, isEncrypted } from "../encryption";

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

// ===================== VPS Restream Endpoints =====================

// GET /api/restream/vps-config — returns decrypted restream config for the VPS
// Mounted separately at /api/restream in routes.ts
export const vpsRestreamRouter = Router();

vpsRestreamRouter.get("/vps-config", async (req, res) => {
  const secret = req.headers["x-vps-secret"] as string | undefined;
  const expectedSecret = process.env.RESTREAM_VPS_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(403).json({ error: "Invalid VPS secret" });
  }

  try {
    const configs = await storage.getPlatformConfigs();
    const result: Record<string, { enabled: boolean; rtmpUrl?: string }> = {};

    for (const config of configs) {
      if (config.enabled && config.streamKey && config.rtmpUrl) {
        try {
          const decryptedKey = decrypt(config.streamKey);
          result[config.platform] = {
            enabled: true,
            rtmpUrl: `${config.rtmpUrl}/${decryptedKey}`,
          };
        } catch {
          result[config.platform] = { enabled: false };
        }
      } else {
        result[config.platform] = { enabled: false };
      }
    }

    // Ensure both platforms are always present in the response
    if (!result.youtube) result.youtube = { enabled: false };
    if (!result.facebook) result.facebook = { enabled: false };

    res.json(result);
  } catch (err) {
    console.error("Error fetching VPS restream config:", err);
    res.status(500).json({ error: "Failed to fetch restream config" });
  }
});

// POST /api/restream/vps-status — VPS reports restream status changes
vpsRestreamRouter.post("/vps-status", async (req, res) => {
  const secret = req.headers["x-vps-secret"] as string | undefined;
  const expectedSecret = process.env.RESTREAM_VPS_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return res.status(403).json({ error: "Invalid VPS secret" });
  }

  const { platform, status, errorMessage } = req.body;

  if (!platform || !status) {
    return res.status(400).json({ error: "platform and status are required" });
  }

  if (platform !== "youtube" && platform !== "facebook") {
    return res.status(400).json({ error: "Invalid platform" });
  }

  if (!["idle", "active", "error"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'idle', 'active', or 'error'" });
  }

  try {
    const data: Record<string, unknown> = {
      platform,
      status,
      errorMessage: errorMessage || null,
    };

    if (status === "active") {
      data.startedAt = new Date();
      data.stoppedAt = null;
    } else if (status === "idle") {
      data.stoppedAt = new Date();
    }

    const result = await storage.upsertRestreamStatus(platform, data);
    res.json(result);
  } catch (err) {
    console.error("Error updating VPS restream status:", err);
    res.status(500).json({ error: "Failed to update restream status" });
  }
});

export default router;
