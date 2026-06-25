import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { encrypt, decrypt } from "../encryption";
import { getOAuthUrl, exchangeCode, revokeToken } from "../youtubeOauth";
import { scheduleNextMonths, cancelBroadcast, getUpcomingServiceDates } from "../youtubeScheduler";

const router = Router();

// In-memory state store — expires after 10 minutes
const pendingStates = new Set<string>();

// GET /api/admin/youtube-auth/status
router.get("/status", requireAuth, async (_req, res) => {
  try {
    const token = await storage.getYoutubeOauthToken();
    res.json({ connected: !!token });
  } catch {
    res.json({ connected: false });
  }
});

// GET /api/admin/youtube-auth/authorize — returns OAuth URL for the frontend to open
router.get("/authorize", requireAuth, async (_req, res) => {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    pendingStates.add(state);
    setTimeout(() => pendingStates.delete(state), 10 * 60 * 1000);
    const url = getOAuthUrl(state);
    res.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate auth URL";
    console.error("[YouTubeOAuth] authorize error:", err);
    res.status(500).json({ error: message });
  }
});

// GET /api/admin/youtube-auth/callback — Google redirects here after authorization
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;
  const base = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");

  if (error) {
    console.error("[YouTubeOAuth] OAuth error:", error);
    return res.redirect(`${base}/admin?tab=stream&ytauth=error`);
  }

  if (!state || !pendingStates.has(state)) {
    console.warn("[YouTubeOAuth] Invalid or expired state");
    return res.redirect(`${base}/admin?tab=stream&ytauth=error`);
  }
  pendingStates.delete(state);

  if (!code) {
    return res.redirect(`${base}/admin?tab=stream&ytauth=error`);
  }

  try {
    const { accessToken, refreshToken, expiresAt } = await exchangeCode(code);
    await storage.setYoutubeOauthToken({
      accessToken: encrypt(accessToken),
      refreshToken: encrypt(refreshToken),
      expiresAt,
    });
    console.log("[YouTubeOAuth] YouTube account connected successfully");
    return res.redirect(`${base}/admin?tab=stream&ytauth=success`);
  } catch (err) {
    console.error("[YouTubeOAuth] Token exchange error:", err);
    return res.redirect(`${base}/admin?tab=stream&ytauth=error`);
  }
});

// GET /api/admin/youtube-auth/scheduled-broadcasts
router.get("/scheduled-broadcasts", requireAuth, async (_req, res) => {
  try {
    const broadcasts = await storage.getScheduledBroadcasts();
    res.json(broadcasts);
  } catch (err) {
    console.error("[YouTubeOAuth] list broadcasts error:", err);
    res.status(500).json({ error: "Failed to list broadcasts" });
  }
});

// POST /api/admin/youtube-auth/schedule — create next N months of broadcasts
router.post("/schedule", requireAuth, async (req, res) => {
  const months = Math.min(parseInt(req.body?.months) || 3, 6);
  try {
    const result = await scheduleNextMonths(months);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to schedule broadcasts";
    console.error("[YouTubeOAuth] schedule error:", err);
    res.status(500).json({ error: message });
  }
});

// DELETE /api/admin/youtube-auth/scheduled-broadcasts/:broadcastId — cancel one
router.delete("/scheduled-broadcasts/:broadcastId", requireAuth, async (req, res) => {
  try {
    await cancelBroadcast(req.params.broadcastId);
    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel broadcast";
    console.error("[YouTubeOAuth] cancel error:", err);
    res.status(500).json({ error: message });
  }
});

// GET /api/admin/youtube-auth/preview-schedule — see what would be scheduled (no API calls)
router.get("/preview-schedule", requireAuth, (_req, res) => {
  try {
    const services = getUpcomingServiceDates(3);
    res.json(services.map((s) => ({ ...s, scheduledStart: s.scheduledStart.toISOString() })));
  } catch (err) {
    res.status(500).json({ error: "Failed to preview schedule" });
  }
});

// DELETE /api/admin/youtube-auth — revoke + delete stored token
router.delete("/", requireAuth, async (_req, res) => {
  try {
    const token = await storage.getYoutubeOauthToken();
    if (token?.accessToken) {
      try {
        await revokeToken(decrypt(token.accessToken));
      } catch {
        // Best-effort revoke — don't block deletion
      }
    }
    await storage.deleteYoutubeOauthToken();
    res.json({ ok: true });
  } catch (err) {
    console.error("[YouTubeOAuth] revoke error:", err);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

export default router;
