import { Router } from "express";
import { storage } from "../storage";
import { decrypt } from "../encryption";
import { fetchPastLiveStreams, fetchVideoDetails } from "../youtube";

const router = Router();

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// GET /api/youtube/past-streams?page=<token>&limit=12 (public endpoint)
router.get("/past-streams", async (req, res) => {
  const pageToken = req.query.page as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);

  try {
    // Check cache age first
    const cacheAge = await storage.getStreamCacheAge();
    const cacheValid = cacheAge !== null && cacheAge < CACHE_TTL_MS;

    // If cache is valid and no specific page token, return cached data
    if (cacheValid && !pageToken) {
      const cached = await storage.getCachedStreams(limit);
      if (cached.length > 0) {
        return res.json({
          items: cached,
          nextPageToken: null, // Cached data doesn't have pagination tokens
          fromCache: true,
        });
      }
    }

    // Get YouTube config
    const ytConfig = await storage.getPlatformConfig("youtube");
    if (!ytConfig?.channelId || !ytConfig?.apiKey) {
      // No YouTube config — return cached data if available, otherwise empty
      const cached = await storage.getCachedStreams(limit);
      return res.json({
        items: cached,
        nextPageToken: null,
        fromCache: true,
      });
    }

    // Decrypt API key
    let apiKey: string;
    try {
      apiKey = decrypt(ytConfig.apiKey);
    } catch {
      // If decryption fails, return cached data
      const cached = await storage.getCachedStreams(limit);
      return res.json({
        items: cached,
        nextPageToken: null,
        fromCache: true,
      });
    }

    // Fetch from YouTube API
    const searchResult = await fetchPastLiveStreams(
      ytConfig.channelId,
      apiKey,
      limit,
      pageToken
    );

    if (searchResult.items.length === 0) {
      const cached = await storage.getCachedStreams(limit);
      return res.json({
        items: cached,
        nextPageToken: null,
        fromCache: cached.length > 0,
      });
    }

    // Fetch video details (duration, view counts)
    const videoIds = searchResult.items.map((item) => item.id.videoId);
    const details = await fetchVideoDetails(videoIds, apiKey);
    const detailsMap = new Map(details.map((d) => [d.id, d]));

    // Upsert into cache
    const items = [];
    for (const item of searchResult.items) {
      const detail = detailsMap.get(item.id.videoId);
      const thumbnail =
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url ||
        null;

      const cached = await storage.upsertStreamCache({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: thumbnail,
        publishedAt: new Date(item.snippet.publishedAt),
        duration: detail?.contentDetails?.duration || null,
        viewCount: detail ? parseInt(detail.statistics.viewCount) || 0 : 0,
        likeCount: detail ? parseInt(detail.statistics.likeCount) || 0 : 0,
        cachedAt: new Date(),
      });
      items.push(cached);
    }

    res.json({
      items,
      nextPageToken: searchResult.nextPageToken || null,
      fromCache: false,
    });
  } catch (err) {
    console.error("[YouTube] Error fetching past streams:", err);
    // Fall back to cache on any error
    try {
      const cached = await storage.getCachedStreams(limit);
      return res.json({
        items: cached,
        nextPageToken: null,
        fromCache: true,
      });
    } catch {
      res.status(500).json({ error: "Failed to fetch past streams" });
    }
  }
});

export default router;
