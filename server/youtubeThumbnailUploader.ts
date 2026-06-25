import sharp from "sharp";
import { getValidAccessToken } from "./youtubeOauth";

function guessServiceType(): string {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();
  // Dallas is UTC-5 (CDT) or UTC-6 (CST). Use UTC-5 as a safe approximation.
  const localHour = (utcHour - 5 + 24) % 24;

  if (utcDay === 0) {
    return localHour < 15 ? "sunday-morning" : "sunday-evening";
  } else if (utcDay === 4) {
    return "thursday";
  }
  return "sunday-morning";
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

  const serviceType = guessServiceType();
  const dateStr = new Date().toISOString().slice(0, 10);
  console.log(`[ThumbUpload] Generating ${serviceType} thumbnail for ${dateStr}`);

  const svg = buildThumbnailSvg(serviceType, dateStr);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  const broadcastId = await getActiveBroadcastId(accessToken);
  if (!broadcastId) {
    console.log("[ThumbUpload] No active YouTube broadcast found — skipping upload");
    return;
  }

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
