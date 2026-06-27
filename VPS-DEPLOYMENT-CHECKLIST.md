# VPS Deployment Checklist — Live Restreaming & Past Streams

Run these steps on the DigitalOcean VPS after deploying the latest code.

> **Authoritative streaming stack lives in the `thephotocrm/streaming-vps` repo.**
> Deploy *that* repo on the VPS — it uses MediaMTX path `live/live` (matching the backend's
> hardcoded HLS URLs), `runOnReady: /restream.sh`, and the `upload-recording.sh` cron.
> The old `church-desktop-website/streaming/` bundle has been removed; do **not** deploy it
> (it used path `live`, which silently breaks live detection, the HLS player, the YouTube
> auto-transition, and recording uploads).

---

## 1. Push Database Schema

```bash
npm run db:push
```

This applies recent schema changes, including:
- `recordings.file_size_bytes` widened to **bigint** (multi-GB service recordings no longer 500 on ingest)
- unique constraint on `recordings.r2_key` (idempotent ingest)
- `streamId` column on `youtube_scheduled_broadcasts` (go-live re-bind)

> If `db:push` reports duplicate `r2_key` values, de-duplicate the `recordings` table first,
> then re-run.

---

## 2. Deploy the streaming-vps stack

```bash
git clone https://github.com/thephotocrm/streaming-vps /opt/streaming
cd /opt/streaming
cp .env.example .env        # then fill in real values (see §3)
./setup.sh                  # installs ffmpeg + awscli, configures the r2 profile, installs the cron
docker compose up -d --build
```

`setup.sh` wires the `upload-recording.sh` cron (every 2 min) and host dependencies.
`docker compose` starts MediaMTX (ports 1935 / 8888 / 8554) with `restream.sh` as the
`runOnReady` relay.

---

## 3. Environment Variables (`/opt/streaming/.env`)

```bash
# RTMP ingest key — OBS must publish with this as the stream key (now enforced by MediaMTX)
MTX_STREAM_KEY=...

# Restream config fetch + status reporting
REPLIT_API_URL=https://fpcd.life
VPS_SECRET=...               # must equal RESTREAM_VPS_SECRET on the backend

# Recording upload pipeline
R2_BUCKET_NAME=...
R2_ACCOUNT_ID=...
R2_PUBLIC_URL=https://...    # MUST include the https:// scheme, or ingest rejects it (400)
RECORDING_INGEST_SECRET=...  # must equal RECORDING_INGEST_SECRET on the backend
```

Backend (Replit) env vars that must match:
- `RESTREAM_VPS_SECRET` = the VPS `VPS_SECRET`
- `RECORDING_INGEST_SECRET` = the VPS `RECORDING_INGEST_SECRET`
- `ENCRYPTION_KEY` (32-byte hex) for stream keys stored in the DB
- Leave `ENABLE_BACKEND_RESTREAM` **unset** — the VPS `restream.sh` is the only relay.

---

## 4. Install ffmpeg on the host (if `setup.sh` was skipped)

```bash
sudo apt-get update && sudo apt-get install -y ffmpeg awscli
```

---

## After Deployment — Verify

1. Log into `/admin` → **Restream** tab; enter YouTube/Facebook stream keys + channel URLs.
2. For YouTube broadcasts: connect the YouTube account (OAuth) and confirm the stream key in
   Admin → Stream **exactly matches** your channel's ingestion key (otherwise scheduling now
   fails fast with a clear error instead of binding the wrong stream).
3. Start OBS (using `MTX_STREAM_KEY`) → confirm restream status goes to "active".
4. Confirm the site-wide "Live Now" banner appears, and the YouTube broadcast goes live.
5. Stop OBS → wait for the recording to upload → visit `/past-streams` and confirm it appears
   after you publish it from the admin.
