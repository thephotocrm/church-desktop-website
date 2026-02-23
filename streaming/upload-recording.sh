#!/usr/bin/env bash
#
# upload-recording.sh — Scans for finished .mp4 recordings, uploads to R2,
# then calls the Express ingest API to save metadata.
#
# Usage: Run via cron every 2 minutes:
#   */2 * * * * /opt/streaming/upload-recording.sh >> /var/log/recording-upload.log 2>&1
#
set -euo pipefail

# ── Config (override via /opt/streaming/.env) ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env"
fi

RECORDINGS_DIR="${RECORDINGS_DIR:-/opt/streaming/recordings}"
R2_BUCKET="${R2_BUCKET_NAME:?R2_BUCKET_NAME not set}"
R2_ACCOUNT_ID="${R2_ACCOUNT_ID:?R2_ACCOUNT_ID not set}"
R2_PUBLIC_URL="${R2_PUBLIC_URL:?R2_PUBLIC_URL not set}"
REPLIT_API_URL="${REPLIT_API_URL:?REPLIT_API_URL not set}"
RECORDING_INGEST_SECRET="${RECORDING_INGEST_SECRET:?RECORDING_INGEST_SECRET not set}"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
AWS_PROFILE="${AWS_PROFILE:-r2}"
LOCK_FILE="/tmp/upload-recording.lock"

# ── Locking (prevent overlapping runs) ──
if [ -f "$LOCK_FILE" ]; then
  LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    echo "[$(date -Iseconds)] Another upload is running (PID $LOCK_PID), skipping."
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# ── Helper: check if file is still being written ──
is_stable() {
  local file="$1"
  local size1 size2
  size1=$(stat -c%s "$file" 2>/dev/null || echo 0)
  sleep 2
  size2=$(stat -c%s "$file" 2>/dev/null || echo 0)
  [ "$size1" = "$size2" ] && [ "$size1" -gt 0 ]
}

echo "[$(date -Iseconds)] Scanning $RECORDINGS_DIR for .mp4 files..."

shopt -s nullglob
files=("$RECORDINGS_DIR"/*.mp4)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "[$(date -Iseconds)] No .mp4 files found."
  exit 0
fi

for filepath in "${files[@]}"; do
  filename=$(basename "$filepath")
  name="${filename%.mp4}"

  echo "[$(date -Iseconds)] Found: $filename"

  # Skip files still being written
  if ! is_stable "$filepath"; then
    echo "[$(date -Iseconds)] $filename is still being written, skipping."
    continue
  fi

  # Get duration via ffprobe
  duration=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$filepath" 2>/dev/null || echo "0")
  duration=$(printf "%.0f" "$duration")
  echo "[$(date -Iseconds)] Duration: ${duration}s"

  # Get file size
  filesize=$(stat -c%s "$filepath")
  echo "[$(date -Iseconds)] Size: $filesize bytes"

  # Extract thumbnail at 5s mark
  thumb_path="${RECORDINGS_DIR}/${name}_thumb.jpg"
  if ffmpeg -y -i "$filepath" -ss 5 -vframes 1 -q:v 2 "$thumb_path" 2>/dev/null; then
    echo "[$(date -Iseconds)] Thumbnail extracted."
  else
    echo "[$(date -Iseconds)] Thumbnail extraction failed (short video?)."
    thumb_path=""
  fi

  # Upload video to R2
  video_key="videos/${name}.mp4"
  echo "[$(date -Iseconds)] Uploading video to R2: $video_key"
  aws s3 cp "$filepath" "s3://${R2_BUCKET}/${video_key}" \
    --endpoint-url "$R2_ENDPOINT" \
    --profile "$AWS_PROFILE" \
    --content-type "video/mp4"

  video_url="${R2_PUBLIC_URL}/${video_key}"

  # Upload thumbnail to R2
  thumbnail_url=""
  if [ -n "$thumb_path" ] && [ -f "$thumb_path" ]; then
    thumb_key="thumbnails/${name}.jpg"
    echo "[$(date -Iseconds)] Uploading thumbnail to R2: $thumb_key"
    aws s3 cp "$thumb_path" "s3://${R2_BUCKET}/${thumb_key}" \
      --endpoint-url "$R2_ENDPOINT" \
      --profile "$AWS_PROFILE" \
      --content-type "image/jpeg"
    thumbnail_url="${R2_PUBLIC_URL}/${thumb_key}"
  fi

  # Build JSON payload
  json_payload=$(cat <<EOJSON
{
  "title": "Worship Service",
  "r2Key": "$video_key",
  "r2Url": "$video_url",
  "thumbnailUrl": "$thumbnail_url",
  "duration": $duration,
  "fileSize": $filesize
}
EOJSON
)

  # Remove thumbnailUrl if empty
  if [ -z "$thumbnail_url" ]; then
    json_payload=$(echo "$json_payload" | sed '/"thumbnailUrl": ""/d')
  fi

  # Call Express ingest API
  echo "[$(date -Iseconds)] Calling ingest API..."
  http_code=$(curl -s -o /tmp/ingest-response.json -w "%{http_code}" \
    -X POST "${REPLIT_API_URL}/api/recordings/ingest" \
    -H "Content-Type: application/json" \
    -H "X-Ingest-Secret: ${RECORDING_INGEST_SECRET}" \
    -d "$json_payload")

  if [ "$http_code" = "201" ]; then
    echo "[$(date -Iseconds)] Ingest API success."
    cat /tmp/ingest-response.json
    echo ""

    # Clean up local files
    rm -f "$filepath"
    [ -n "$thumb_path" ] && rm -f "$thumb_path"
    echo "[$(date -Iseconds)] Cleaned up local files for $filename."
  else
    echo "[$(date -Iseconds)] ERROR: Ingest API returned HTTP $http_code"
    cat /tmp/ingest-response.json 2>/dev/null
    echo ""
    # Don't delete — will retry next cron run
  fi

  echo "---"
done

echo "[$(date -Iseconds)] Done."
