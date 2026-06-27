import sharp from "sharp";
import { getValidAccessToken } from "./youtubeOauth";
import { storage } from "./storage";
import { decrypt } from "./encryption";

// ── Service definitions ───────────────────────────────────────────────────────
// dayOfWeek: 0 = Sunday, 4 = Thursday (UTC day)
// Broadcast opens 15 min before service to give viewers time to join
// NOTE: the Sunday-evening "FPC Connect" Bible study is intentionally NOT streamed, so it
// is deliberately absent here. The "sunday-evening" label elsewhere (thumbnail/label maps)
// is only used if an operator manually creates such a broadcast.
const SERVICES = [
  { type: "sunday-morning", dayOfWeek: 0, hourCT: 10, minuteCT: 45 }, // 15 min before 11 AM
  { type: "thursday",       dayOfWeek: 4, hourCT: 19, minuteCT: 15 }, // 15 min before 7:30 PM
] as const;

// ── DST helper (US Central Time) ──────────────────────────────────────────────
// CDT = UTC-5 (second Sun of March → first Sun of November)
// CST = UTC-6 (otherwise)
export function ctToUtcOffset(date: Date): number {
  const y = date.getUTCFullYear();
  // Second Sunday of March
  const marchFirst = new Date(Date.UTC(y, 2, 1));
  const marchOffset = (7 - marchFirst.getUTCDay()) % 7;
  const dstStart = new Date(Date.UTC(y, 2, 1 + marchOffset + 7, 8)); // 2 AM CST
  // First Sunday of November
  const novFirst = new Date(Date.UTC(y, 10, 1));
  const novOffset = (7 - novFirst.getUTCDay()) % 7;
  const dstEnd = new Date(Date.UTC(y, 10, 1 + novOffset, 7)); // 2 AM CDT
  return date >= dstStart && date < dstEnd ? 5 : 6; // CDT=UTC-5, CST=UTC-6
}

function ctToUtc(dateStr: string, hourCT: number, minuteCT: number): Date {
  const base = new Date(dateStr + "T12:00:00Z");
  const offset = ctToUtcOffset(base);
  return new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
    hourCT + offset,
    minuteCT,
  ));
}

// ── Date generation ───────────────────────────────────────────────────────────
export function getUpcomingServiceDates(months: number) {
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + months);

  const results: Array<{ type: string; dateStr: string; scheduledStart: Date }> = [];
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    for (const svc of SERVICES) {
      if (cursor.getUTCDay() === svc.dayOfWeek) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const scheduledStart = ctToUtc(dateStr, svc.hourCT, svc.minuteCT);
        if (scheduledStart > now) {
          results.push({ type: svc.type, dateStr, scheduledStart });
        }
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return results;
}

// ── Thumbnail SVG ─────────────────────────────────────────────────────────────
function buildSvg(type: string, dateStr: string): string {
  const labels: Record<string, { line1: string; line2: string }> = {
    "sunday-morning": { line1: "SUNDAY MORNING",  line2: "WORSHIP SERVICE" },
    "sunday-evening": { line1: "FPC CONNECT",      line2: "BIBLE STUDY & FELLOWSHIP" },
    "thursday":       { line1: "THURSDAY NIGHT",   line2: "WORSHIP SERVICE" },
  };
  const label = labels[type] ?? labels["sunday-morning"];
  const dateObj = new Date(dateStr + "T12:00:00Z");
  const formatted = dateObj.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const W = 1280, H = 720;
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e2f5c"/>
        <stop offset="100%" stop-color="#0c1525"/>
      </linearGradient>
      <linearGradient id="gl" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#d4a017" stop-opacity="0"/>
        <stop offset="20%" stop-color="#d4a017"/>
        <stop offset="80%" stop-color="#d4a017"/>
        <stop offset="100%" stop-color="#d4a017" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="gw" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#2a3f80" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#0c1525" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#gw)"/>
    <rect x="0" y="88" width="${W}" height="1.5" fill="url(#gl)"/>
    <rect x="0" y="628" width="${W}" height="1.5" fill="url(#gl)"/>
    <text x="${W/2}" y="62" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="26" fill="#d4a017" letter-spacing="5">FIRST PENTECOSTAL CHURCH OF DALLAS</text>
    <text x="${W/2}" y="330" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="108" font-weight="bold" fill="white">${label.line1}</text>
    <text x="${W/2}" y="448" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="58" fill="rgba(255,255,255,0.80)">${label.line2}</text>
    <rect x="200" y="498" width="360" height="1" fill="#d4a017" opacity="0.5"/>
    <rect x="720" y="498" width="360" height="1" fill="#d4a017" opacity="0.5"/>
    <line x1="625" y1="487" x2="655" y2="487" stroke="#d4a017" stroke-width="1.5" opacity="0.8"/>
    <line x1="640" y1="472" x2="640" y2="502" stroke="#d4a017" stroke-width="1.5" opacity="0.8"/>
    <text x="${W/2}" y="575" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="36" fill="#d4a017" letter-spacing="3">${formatted.toUpperCase()}</text>
  </svg>`;
}

// ── YouTube API helpers ───────────────────────────────────────────────────────
function serviceTitle(type: string, dateStr: string): string {
  const dateObj = new Date(dateStr + "T12:00:00Z");
  const f = dateObj.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  if (type === "sunday-morning") return `Sunday Morning Worship | ${f}`;
  if (type === "thursday")       return `Thursday Night Worship | ${f}`;
  return `First Pentecostal Church of Dallas | ${f}`;
}

async function getDefaultStreamId(accessToken: string): Promise<string | null> {
  // Fetch all reusable streams with their ingestion keys so we can match against
  // the stream key saved in the platform config (what the VPS actually pushes to).
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/liveStreams?part=id,cdn,snippet&mine=true&maxResults=50",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    console.warn("[Scheduler] Failed to fetch live streams:", await res.text());
    return null;
  }
  const data = await res.json() as {
    items?: Array<{ id: string; cdn?: { ingestionInfo?: { streamName?: string } } }>;
  };
  const items = data.items ?? [];
  if (items.length === 0) return null;

  // Match against the platform config stream key (what the VPS actually pushes to).
  let ytConfig;
  try {
    ytConfig = await storage.getPlatformConfig("youtube");
  } catch (err) {
    console.warn("[Scheduler] Could not read platform config:", err);
  }

  if (ytConfig?.streamKey) {
    const configKey = decrypt(ytConfig.streamKey);
    const matched = items.find((s) => s.cdn?.ingestionInfo?.streamName === configKey);
    if (matched) {
      console.log(`[Scheduler] Matched stream ${matched.id} to platform config key`);
      return matched.id;
    }
    // No stream's ingestion key equals the configured key. Binding to items[0] would
    // create a broadcast the VPS never feeds (silently never goes live). Hard-fail so
    // the admin fixes the mismatch instead of getting a broadcast that can't work.
    console.error(
      "[Scheduler] No channel stream matches the YouTube stream key in Admin → Stream. " +
        "Refusing to bind to an arbitrary stream. Fix the stream key to match your channel.",
    );
    return null;
  }

  // No stream key configured. Only safe when the channel has exactly one stream.
  if (items.length === 1) {
    console.log(`[Scheduler] No config key set; using the channel's only stream: ${items[0].id}`);
    return items[0].id;
  }
  console.error(
    `[Scheduler] No stream key configured and channel has ${items.length} streams — cannot pick safely. ` +
      "Set the YouTube stream key in Admin → Stream.",
  );
  return null;
}

async function createBroadcast(accessToken: string, title: string, scheduledStart: Date): Promise<string | null> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,status,contentDetails",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        snippet: {
          title,
          scheduledStartTime: scheduledStart.toISOString(),
          description: "Live worship service from First Pentecostal Church of Dallas\n110 Security Ct, Wylie, TX 75098",
        },
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
          enableDvr: true,
          latencyPreference: "normal",
          monitorStream: { enableMonitorStream: false },
        },
      }),
    },
  );
  if (!res.ok) {
    console.error("[Scheduler] Failed to create broadcast:", await res.text());
    return null;
  }
  const data = await res.json() as { id?: string };
  return data.id ?? null;
}

async function bindBroadcast(accessToken: string, broadcastId: string, streamId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastId}&streamId=${streamId}&part=id`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) console.warn("[Scheduler] Bind failed (non-fatal):", await res.text());
}

async function uploadThumbnail(accessToken: string, broadcastId: string, type: string, dateStr: string): Promise<boolean> {
  const png = await sharp(Buffer.from(buildSvg(type, dateStr))).png().toBuffer();
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${broadcastId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "image/png" },
      body: png,
    },
  );
  if (!res.ok) console.error("[Scheduler] Thumbnail upload failed:", await res.text());
  return res.ok;
}

// ── Main export ───────────────────────────────────────────────────────────────
export interface ScheduleResult {
  scheduled: number;
  skipped: number;
  errors: number;
  broadcasts: Array<{ type: string; dateStr: string; broadcastId: string; title: string }>;
}

export async function scheduleNextMonths(months = 3): Promise<ScheduleResult> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("YouTube account not connected");

  const streamId = await getDefaultStreamId(accessToken);
  if (!streamId) {
    // Don't create broadcasts that can never go live. Surface a fixable error to the admin.
    throw new Error(
      "No YouTube stream matched. Ensure your channel has a stream and that the stream key " +
        "in Admin → Stream exactly matches your channel's ingestion key, then schedule again.",
    );
  }
  const services = getUpcomingServiceDates(months);
  const result: ScheduleResult = { scheduled: 0, skipped: 0, errors: 0, broadcasts: [] };

  // Check existing scheduled broadcasts to avoid duplicates
  const existing = await storage.getScheduledBroadcasts();
  const existingKeys = new Set(existing.map((b) => `${b.serviceType}|${b.serviceDate}`));

  for (const svc of services) {
    const key = `${svc.type}|${svc.dateStr}`;
    if (existingKeys.has(key)) {
      result.skipped++;
      continue;
    }

    try {
      const title = serviceTitle(svc.type, svc.dateStr);
      const broadcastId = await createBroadcast(accessToken, title, svc.scheduledStart);
      if (!broadcastId) { result.errors++; continue; }

      await bindBroadcast(accessToken, broadcastId, streamId);

      const thumbnailSet = await uploadThumbnail(accessToken, broadcastId, svc.type, svc.dateStr);

      await storage.saveScheduledBroadcast({
        broadcastId,
        serviceType: svc.type,
        serviceDate: svc.dateStr,
        scheduledStart: svc.scheduledStart,
        title,
        streamId,
        thumbnailSet,
      });

      result.scheduled++;
      result.broadcasts.push({ type: svc.type, dateStr: svc.dateStr, broadcastId, title });

      // Small delay to avoid hitting YouTube rate limits
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error("[Scheduler] Error for", svc.dateStr, svc.type, err);
      result.errors++;
    }
  }

  return result;
}

// ── Auto-transition: called by routes.ts when HLS goes live / offline ─────────
// When OBS starts sending RTMP to YouTube, the YouTube stream enters "active"
// state and the bound broadcast enters "ready". We then call `transition?live`
// to move it from ready → live.  On stream end we call `transition?complete`.

async function getBroadcastStatus(accessToken: string, broadcastId: string): Promise<string | null> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts?id=${broadcastId}&part=status`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return null;
  const data = await res.json() as { items?: Array<{ status: { lifeCycleStatus: string } }> };
  return data.items?.[0]?.status?.lifeCycleStatus ?? null;
}

async function transitionBroadcast(accessToken: string, broadcastId: string, status: "live" | "complete"): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=${status}&id=${broadcastId}&part=status`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    const text = await res.text();
    console.warn(`[Scheduler] Transition to ${status} failed:`, text);
  }
  return res.ok;
}

export async function transitionNearestBroadcast(to: "live" | "complete"): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return; // YouTube not connected — silently skip

    const broadcasts = await storage.getScheduledBroadcasts();
    if (broadcasts.length === 0) return;

    const now = new Date();
    const MIN = 60 * 1000;

    // Direction-aware window (diffMs = now - scheduledStart):
    //  - "live": tolerate early OBS starts (up to 2h before) and long pre-rolls (up to 4h after),
    //    so an early start that later enters the service window still gets a backstop transition.
    //  - "complete": stay generous so a long service (>2h) still gets completed and its row cleaned up.
    const lowerMs = to === "live" ? -120 * MIN : -120 * MIN;
    const upperMs = to === "live" ? 240 * MIN : 720 * MIN;
    const candidates = broadcasts.filter((b) => {
      const diffMs = now.getTime() - new Date(b.scheduledStart).getTime();
      return diffMs >= lowerMs && diffMs <= upperMs;
    });

    if (candidates.length === 0) {
      console.log("[Scheduler] No broadcast in window for auto-transition");
      return;
    }

    // Pick closest to now
    candidates.sort(
      (a, b) =>
        Math.abs(new Date(a.scheduledStart).getTime() - now.getTime()) -
        Math.abs(new Date(b.scheduledStart).getTime() - now.getTime()),
    );
    const broadcast = candidates[0];

    if (to === "live") {
      // Self-heal the binding: if the admin fixed/changed the stream key after this
      // broadcast was scheduled, re-bind to the stream the VPS is actually feeding now,
      // before it goes live (binding is only possible while not yet live).
      try {
        const liveStreamId = await getDefaultStreamId(accessToken);
        if (liveStreamId && liveStreamId !== broadcast.streamId) {
          console.log(`[Scheduler] Re-binding ${broadcast.broadcastId} to current stream ${liveStreamId}`);
          await bindBroadcast(accessToken, broadcast.broadcastId, liveStreamId);
          await storage.updateScheduledBroadcastStream(broadcast.broadcastId, liveStreamId);
        }
      } catch (err) {
        console.warn("[Scheduler] Pre-live re-bind check failed (continuing):", err);
      }

      // YouTube stream needs time to become "active" and broadcast to reach "ready"
      // Retry up to 6 times with 10s gaps (= up to ~1 min after HLS goes live)
      let succeeded = false;
      for (let attempt = 0; attempt < 6; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 10_000));

        const currentStatus = await getBroadcastStatus(accessToken, broadcast.broadcastId);
        console.log(`[Scheduler] Broadcast ${broadcast.broadcastId} status: ${currentStatus} (attempt ${attempt + 1})`);

        if (currentStatus === "live") {
          console.log("[Scheduler] Broadcast already live");
          succeeded = true;
          break;
        }

        if (currentStatus === "ready") {
          succeeded = await transitionBroadcast(accessToken, broadcast.broadcastId, "live");
          if (succeeded) {
            console.log(`[Scheduler] ✓ Broadcast ${broadcast.broadcastId} transitioned to live`);
            break;
          }
        }
        // If still "created" or "testing", keep retrying
      }

      if (!succeeded) {
        console.warn("[Scheduler] Could not auto-transition broadcast to live after retries");
      }
    } else {
      // Transition to complete. enableAutoStop usually moves the broadcast to "complete"
      // before we observe the offline edge, so also clean up the row when it is already
      // terminal — otherwise youtube_scheduled_broadcasts rows leak forever.
      const currentStatus = await getBroadcastStatus(accessToken, broadcast.broadcastId);
      if (currentStatus === "live" || currentStatus === "ready" || currentStatus === "testing") {
        const ok = await transitionBroadcast(accessToken, broadcast.broadcastId, "complete");
        if (ok) {
          console.log(`[Scheduler] ✓ Broadcast ${broadcast.broadcastId} transitioned to complete`);
          await storage.deleteScheduledBroadcast(broadcast.broadcastId);
        }
      } else if (currentStatus === "complete" || currentStatus === "revoked") {
        console.log(`[Scheduler] Broadcast ${broadcast.broadcastId} already ${currentStatus} — cleaning up row`);
        await storage.deleteScheduledBroadcast(broadcast.broadcastId);
      } else {
        // null (transient API error) or "created" — leave the row for a later attempt.
        console.log(`[Scheduler] Broadcast ${broadcast.broadcastId} status ${currentStatus} — skipping complete transition`);
      }
    }
  } catch (err) {
    console.error("[Scheduler] transitionNearestBroadcast error:", err);
  }
}

export async function cancelBroadcast(broadcastId: string): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error("YouTube account not connected");

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=complete&id=${broadcastId}&part=status`,
    { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  // Transition may fail if not live — that's fine; we still remove from DB
  if (!res.ok) console.warn("[Scheduler] Broadcast transition failed (may already be complete)");

  await storage.deleteScheduledBroadcast(broadcastId);
}
