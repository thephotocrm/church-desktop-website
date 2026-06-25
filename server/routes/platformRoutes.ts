import { Router } from "express";
import { storage } from "../storage";
import { requireAuth } from "../auth";
import { encrypt, decrypt, mask, isEncrypted } from "../encryption";
import sharp from "sharp";

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

// GET /api/admin/thumbnail/pre-stream?type=sunday-morning&date=2026-06-29
router.get("/thumbnail/pre-stream", requireAuth, async (req, res) => {
  const type = (req.query.type as string) || "sunday-morning";
  const dateStr = (req.query.date as string) || new Date().toISOString().slice(0, 10);

  const serviceLabels: Record<string, { line1: string; line2: string }> = {
    "sunday-morning":  { line1: "SUNDAY MORNING",  line2: "WORSHIP SERVICE" },
    "sunday-evening":  { line1: "FPC CONNECT",      line2: "BIBLE STUDY & FELLOWSHIP" },
    "thursday":        { line1: "THURSDAY NIGHT",   line2: "WORSHIP SERVICE" },
  };
  const label = serviceLabels[type] || serviceLabels["sunday-morning"];

  const dateObj = new Date(dateStr + "T12:00:00Z");
  const formatted = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

  const W = 1280, H = 720;

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e2f5c"/>
        <stop offset="100%" stop-color="#0c1525"/>
      </linearGradient>
      <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#d4a017" stop-opacity="0"/>
        <stop offset="20%" stop-color="#d4a017"/>
        <stop offset="80%" stop-color="#d4a017"/>
        <stop offset="100%" stop-color="#d4a017" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- Subtle corner glow -->
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#2a3f80" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0c1525" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>

    <!-- Gold top line -->
    <rect x="0" y="88" width="${W}" height="1.5" fill="url(#goldLine)"/>
    <!-- Gold bottom line -->
    <rect x="0" y="628" width="${W}" height="1.5" fill="url(#goldLine)"/>

    <!-- Church name -->
    <text x="${W / 2}" y="62" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="26" fill="#d4a017" letter-spacing="5">
      FIRST PENTECOSTAL CHURCH OF DALLAS
    </text>

    <!-- Service label line 1 -->
    <text x="${W / 2}" y="330" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="108" font-weight="bold" fill="white">
      ${label.line1}
    </text>

    <!-- Service label line 2 -->
    <text x="${W / 2}" y="448" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="58" fill="rgba(255,255,255,0.80)">
      ${label.line2}
    </text>

    <!-- Gold divider with cross -->
    <rect x="200" y="498" width="360" height="1" fill="#d4a017" opacity="0.5"/>
    <rect x="720" y="498" width="360" height="1" fill="#d4a017" opacity="0.5"/>
    <!-- Small cross -->
    <line x1="625" y1="487" x2="655" y2="487" stroke="#d4a017" stroke-width="1.5" opacity="0.8"/>
    <line x1="640" y1="472" x2="640" y2="502" stroke="#d4a017" stroke-width="1.5" opacity="0.8"/>

    <!-- Date -->
    <text x="${W / 2}" y="575" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="36" fill="#d4a017" letter-spacing="3">
      ${formatted.toUpperCase()}
    </text>
  </svg>`;

  try {
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    const filename = `fpcd-${type}-${dateStr}.png`;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(png);
  } catch (err) {
    console.error("[PreStreamThumb] Error generating thumbnail:", err);
    res.status(500).json({ error: "Failed to generate thumbnail" });
  }
});

export default router;
