# VPS Deployment Checklist — Live Restreaming & Past Streams

Run these steps on the Digital Ocean VPS after deploying the latest code.

---

## 1. Push Database Schema

```bash
npm run db:push
```

When prompted, select **"create table"** for each of these 3 new tables:
- `platform_config`
- `youtube_stream_cache`
- `restream_status`

---

## 2. Set Environment Variables

Add these to your `.env` or however you manage env vars on the VPS:

```bash
# Generate a 32-byte hex encryption key for stream keys stored in DB
export ENCRYPTION_KEY=$(openssl rand -hex 32)

# Shared secret for MediaMTX -> Express webhook authentication
export WEBHOOK_SECRET=$(openssl rand -hex 16)
```

Make sure the Express server and the MediaMTX container both have access to `WEBHOOK_SECRET`.

---

## 3. Install ffmpeg

```bash
sudo apt-get update && sudo apt-get install -y ffmpeg
```

Verify: `ffmpeg -version`

---

## 4. Restart MediaMTX

```bash
cd streaming/
docker compose down
docker compose up -d
```

This picks up the new `mediamtx.yml` webhook hooks and the `WEBHOOK_SECRET` env var.

---

## After Deployment — Verify

1. Log into `/admin` → go to the **Restream** tab
2. Enter YouTube/Facebook stream keys and channel URLs
3. For YouTube past streams: enter Channel ID and YouTube Data API key
4. Start OBS → confirm restream status goes to "active"
5. Visit `/past-streams` → confirm past broadcasts load
6. Confirm the red "Live Now" banner appears site-wide when streaming
