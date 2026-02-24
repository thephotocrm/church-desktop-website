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

# ── Helper: generate smart title from filename ──
# Expects filename like 2025-02-23_10-30-00.mp4
generate_title() {
  local name="$1"
  # Extract date and time parts
  local date_part="${name:0:10}"   # 2025-02-23
  local time_part="${name:11:8}"   # 10-30-00

  # Parse components
  local year="${date_part:0:4}"
  local month="${date_part:5:2}"
  local day="${date_part:8:2}"
  local hour="${time_part:0:2}"

  # Remove leading zeros for comparison
  hour=$((10#$hour))

  # Get day of week (1=Mon .. 7=Sun)
  local dow
  dow=$(date -d "$date_part" +%u 2>/dev/null || echo "0")

  # Format the date nicely: "Feb 23, 2025"
  local month_names=("" "Jan" "Feb" "Mar" "Apr" "May" "Jun" "Jul" "Aug" "Sep" "Oct" "Nov" "Dec")
  local month_num=$((10#$month))
  local day_num=$((10#$day))
  local nice_date="${month_names[$month_num]} ${day_num}, ${year}"

  # Determine service type based on day/time
  local service_type="Worship Service"
  if [ "$dow" = "7" ]; then
    # Sunday
    if [ "$hour" -lt 14 ]; then
      service_type="Sunday Morning Worship"
    else
      service_type="Sunday Evening Service"
    fi
  elif [ "$dow" = "3" ]; then
    # Wednesday
    service_type="Wednesday Bible Study"
  fi

  echo "${service_type} — ${nice_date}"
}

# ── Helper: generate ISO 8601 timestamp from filename ──
generate_stream_started_at() {
  local name="$1"
  local date_part="${name:0:10}"   # 2025-02-23
  local time_part="${name:11:8}"   # 10-30-00

  # Convert time hyphens to colons: 10-30-00 → 10:30:00
  local time_formatted="${time_part//-/:}"

  echo "${date_part}T${time_formatted}Z"
}

echo "[$(date -Iseconds)] Scanning $RECORDINGS_DIR for .mp4 files..."

shopt -s nullglob
files=("$RECORDINGS_DIR"/*.mp4)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  echo "[$(date -Iseconds)] No .mp4 files found."
  exit 0
fi

# Thumbnail timestamps to capture (in seconds)
THUMB_TIMESTAMPS=(5 30 120 300 600)

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

  # Generate smart title from filename
  smart_title=$(generate_title "$name")
  echo "[$(date -Iseconds)] Title: $smart_title"

  # Generate streamStartedAt ISO 8601 from filename
  stream_started_at=$(generate_stream_started_at "$name")
  echo "[$(date -Iseconds)] Stream started at: $stream_started_at"

  # Generate multiple thumbnail candidates
  thumbnail_urls=()
  primary_thumbnail_url=""

  for ts in "${THUMB_TIMESTAMPS[@]}"; do
    # Skip timestamps beyond the video duration
    if [ "$ts" -ge "$duration" ]; then
      continue
    fi

    thumb_path="${RECORDINGS_DIR}/${name}_thumb_${ts}s.jpg"
    if ffmpeg -y -i "$filepath" -ss "$ts" -vframes 1 -q:v 2 "$thumb_path" 2>/dev/null; then
      thumb_key="thumbnails/${name}_${ts}s.jpg"
      echo "[$(date -Iseconds)] Uploading thumbnail (${ts}s) to R2: $thumb_key"
      aws s3 cp "$thumb_path" "s3://${R2_BUCKET}/${thumb_key}" \
        --endpoint-url "$R2_ENDPOINT" \
        --profile "$AWS_PROFILE" \
        --content-type "image/jpeg"

      thumb_url="${R2_PUBLIC_URL}/${thumb_key}"
      thumbnail_urls+=("$thumb_url")

      # Use 5s mark as the primary thumbnail (or first successful one)
      if [ -z "$primary_thumbnail_url" ]; then
        primary_thumbnail_url="$thumb_url"
      fi

      rm -f "$thumb_path"
    else
      echo "[$(date -Iseconds)] Thumbnail extraction at ${ts}s failed (short video?)."
    fi
  done

  echo "[$(date -Iseconds)] Generated ${#thumbnail_urls[@]} thumbnail candidates."

  # Upload video to R2
  video_key="videos/${name}.mp4"
  echo "[$(date -Iseconds)] Uploading video to R2: $video_key"
  aws s3 cp "$filepath" "s3://${R2_BUCKET}/${video_key}" \
    --endpoint-url "$R2_ENDPOINT" \
    --profile "$AWS_PROFILE" \
    --content-type "video/mp4"

  video_url="${R2_PUBLIC_URL}/${video_key}"

  # Build thumbnail candidates JSON array
  thumb_candidates_json="[]"
  if [ ${#thumbnail_urls[@]} -gt 0 ]; then
    thumb_candidates_json="["
    for i in "${!thumbnail_urls[@]}"; do
      if [ "$i" -gt 0 ]; then
        thumb_candidates_json+=","
      fi
      thumb_candidates_json+="\"${thumbnail_urls[$i]}\""
    done
    thumb_candidates_json+="]"
  fi

  # Build JSON payload
  json_payload=$(cat <<EOJSON
{
  "title": $(printf '%s' "$smart_title" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))'),
  "r2Key": "$video_key",
  "r2Url": "$video_url",
  "thumbnailUrl": "$primary_thumbnail_url",
  "thumbnailCandidates": $thumb_candidates_json,
  "duration": $duration,
  "fileSize": $filesize,
  "streamStartedAt": "$stream_started_at"
}
EOJSON
)

  # Remove thumbnailUrl if empty
  if [ -z "$primary_thumbnail_url" ]; then
    json_payload=$(echo "$json_payload" | python3 -c '
import sys, json
d = json.load(sys.stdin)
if not d.get("thumbnailUrl"):
    del d["thumbnailUrl"]
print(json.dumps(d))
')
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
