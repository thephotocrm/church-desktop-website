import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { encrypt, decrypt } from "../encryption";
import { getOAuthUrl, exchangeCode, revokeToken } from "../youtubeOauth";

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
