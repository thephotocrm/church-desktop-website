import sharp from "sharp";
import { getValidAccessToken } from "./youtubeOauth";
import { ctToUtcOffset } from "./youtubeScheduler";
import { storage } from "./storage";

function guessServiceType(): string {
  const now = new Date();
  // Use the real Central-Time offset (5 CDT / 6 CST) and branch on the CT calendar
  // day/hour, so an evening service that lands on the next UTC day isn't mislabeled.
  const offset = ctToUtcOffset(now);
  const ct = new Date(now.getTime() - offset * 60 * 60 * 1000); // shift so UTC fields read as CT
  const ctDay = ct.getUTCDay();
  const ctHour = ct.getUTCHours();

  if (ctDay === 0) {
    return ctHour < 15 ? "sunday-morning" : "sunday-evening";
  } else if (ctDay === 4) {
    return "thursday";
  }
  return "sunday-morning";
}

// The scheduled broadcast nearest to now (matches transitionNearestBroadcast's window).
// Lets us target the correct broadcast + service type even before YouTube marks it "active".
async function findNearestScheduledBroadcast() {
  try {
    const broadcasts = await storage.getScheduledBroadcasts();
    const now = Date.now();
    const inWindow = broadcasts.filter((b) => {
      const diff = now - new Date(b.scheduledStart).getTime();
      return diff >= -2 * 60 * 60 * 1000 && diff <= 4 * 60 * 60 * 1000;
    });
    if (inWindow.length === 0) return null;
    inWindow.sort(
      (a, b) =>
        Math.abs(new Date(a.scheduledStart).getTime() - now) -
        Math.abs(new Date(b.scheduledStart).getTime() - now),
    );
    return inWindow[0];
  } catch (err) {
    console.error("[ThumbUpload] Failed to read scheduled broadcasts:", err);
    return null;
  }
}

function buildThumbnailSvg(type: string, dateStr: string): string {
  const serviceLabels: Record<string, { line1: string; line2: string }> = {
    "sunday-morning": { line1: "SUNDAY MORNING",  line2: "WORSHIP SERVICE" },
    "sunday-evening": { line1: "FPC CONNECT",      line2: "BIBLE STUDY & FELLOWSHIP" },
    "thursday":       { line1: "THURSDAY NIGHT",   line2: "WORSHIP SERVICE" },
  };
  const label = serviceLabels[type] || serviceLabels["sunday-morning"];

  const dateObj = new Date(dateStr + "T12:00:00Z");
  const formatted = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const W = 1280, H = 720;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
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
      <radialGradient id="glow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#2a3f80" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#0c1525" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <rect x="0" y="88" width="${W}" height="1.5" fill="url(#goldLine)"/>
    <rect x="0" y="628" width="${W}" height="1.5" fill="url(#goldLine)"/>
    <text x="${W / 2}" y="62" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="26" fill="#d4a017" letter-spacing="5">
      FIRST PENTECOSTAL CHURCH OF DALLAS
    </text>
    <text x="${W / 2}" y="330" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="108" font-weight="bold" fill="white">
      ${label.line1}
    </text>
    <text x="${W / 2}" y="448" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif"
      font-size="58" fill="rgba(255,255,255,0.80)">
      ${label.line2}
    </text>
    <rect x="200" y="498" width="360" height="1" fill="#d4a017" opacity="0.5"/>
    <rect x="720" y="498" width="360" height="1" fill="#d4a017" opacity="0.5"/>
    <line x1="625" y1="487" x2="655" y2="487" stroke="#d4a017" stroke-width="1.5" opacity="0.8"/>
    <line x1="640" y1="472" x2="640" y2="502" stroke="#d4a017" stroke-width="1.5" opacity="0.8"/>
    <text x="${W / 2}" y="575" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif"
      font-size="36" fill="#d4a017" letter-spacing="3">
      ${formatted.toUpperCase()}
    </text>
  </svg>`;
}

async function getActiveBroadcastId(accessToken: string): Promise<string | null> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,status&broadcastStatus=active&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    console.error("[ThumbUpload] Failed to list live broadcasts:", await res.text());
    return null;
  }
  const data = await res.json() as { items?: Array<{ id: string }> };
  return data.items?.[0]?.id ?? null;
}

export async function autoUploadThumbnail(): Promise<void> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    console.log("[ThumbUpload] No YouTube OAuth token — skipping auto-thumbnail");
    return;
  }

  // Prefer the nearest scheduled broadcast: it gives the correct service type/date and a
  // broadcastId that exists at the offline->live edge (when the broadcast is still "ready"/
  // "testing", so the broadcastStatus=active lookup would return nothing). Fall back to the
  // active-broadcast lookup + guessed type for manually-created/unscheduled broadcasts.
  const nearest = await findNearestScheduledBroadcast();
  let broadcastId: string | null;
  let serviceType: string;
  let dateStr: string;
  if (nearest) {
    broadcastId = nearest.broadcastId;
    serviceType = nearest.serviceType;
    dateStr = nearest.serviceDate;
  } else {
    serviceType = guessServiceType();
    dateStr = new Date().toISOString().slice(0, 10);
    broadcastId = await getActiveBroadcastId(accessToken);
  }

  if (!broadcastId) {
    console.log("[ThumbUpload] No broadcast found (scheduled or active) — skipping upload");
    return;
  }

  console.log(`[ThumbUpload] Generating ${serviceType} thumbnail for ${dateStr}`);
  const svg = buildThumbnailSvg(serviceType, dateStr);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  console.log(`[ThumbUpload] Uploading to broadcast ${broadcastId}`);

  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${broadcastId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/png",
      },
      body: pngBuffer,
    }
  );

  if (!uploadRes.ok) {
    console.error(`[ThumbUpload] Upload failed (${uploadRes.status}): ${await uploadRes.text()}`);
    return;
  }

  console.log(`[ThumbUpload] Thumbnail uploaded to broadcast ${broadcastId}`);
}
