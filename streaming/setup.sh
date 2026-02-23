#!/usr/bin/env bash
#
# setup.sh — Full VPS setup for MediaMTX streaming + recording upload pipeline
#
# Usage: scp this entire streaming/ directory to /opt/streaming/ on the VPS, then run:
#   chmod +x /opt/streaming/setup.sh && sudo /opt/streaming/setup.sh
#
set -euo pipefail

echo "=== FPC Dallas Streaming VPS Setup ==="

# ── Step 1: Install dependencies ──
echo "[1/6] Installing ffmpeg, awscli, curl..."
apt update && apt install -y ffmpeg awscli curl docker.io docker-compose

# ── Step 2: Ensure directory structure ──
echo "[2/6] Setting up directories..."
mkdir -p /opt/streaming/recordings

# ── Step 3: Make scripts executable ──
echo "[3/6] Making scripts executable..."
chmod +x /opt/streaming/upload-recording.sh

# ── Step 4: Prompt for .env if missing ──
if [ ! -f /opt/streaming/.env ]; then
  echo "[4/6] No .env file found. Creating from template..."
  echo ""
  echo "You need to create /opt/streaming/.env with your credentials."
  echo "Copy .env.example and fill in the values:"
  echo "  cp /opt/streaming/.env.example /opt/streaming/.env"
  echo "  nano /opt/streaming/.env"
  echo ""
  echo "Then configure AWS CLI for R2:"
  echo "  aws configure --profile r2"
  echo "  (Access Key = R2_ACCESS_KEY_ID, Secret = R2_SECRET_ACCESS_KEY, Region = auto, Format = json)"
  echo ""
else
  echo "[4/6] .env file exists, skipping."
fi

# ── Step 5: Set up cron job ──
echo "[5/6] Setting up cron job (every 2 minutes)..."
CRON_CMD="*/2 * * * * /opt/streaming/upload-recording.sh >> /var/log/recording-upload.log 2>&1"
if crontab -l 2>/dev/null | grep -qF "upload-recording.sh"; then
  echo "  Cron job already exists, skipping."
else
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
  echo "  Cron job added."
fi

# ── Step 6: Start MediaMTX ──
echo "[6/6] Starting MediaMTX..."
cd /opt/streaming
docker-compose up -d

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit /opt/streaming/.env with your actual credentials"
echo "  2. Run: aws configure --profile r2"
echo "  3. Set RECORDING_INGEST_SECRET in Replit Secrets (must match .env value)"
echo "  4. Test: stream from OBS, then run /opt/streaming/upload-recording.sh"
echo "  5. Monitor: tail -f /var/log/recording-upload.log"
