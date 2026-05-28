#!/usr/bin/env bash
# Extract WebP frames from an AI-generated shot.
#
# Usage:
#   ./scripts/extract-shot-frames.sh <video_url_or_path> <shot_letter> <start_index>
#
# Example:
#   ./scripts/extract-shot-frames.sh https://cdn... B 24
#   → downloads → 24 evenly-spaced WebP frames → public/frames/hero/desktop/frame_0024.webp ... frame_0047.webp

set -euo pipefail

SRC="${1:-}"
SHOT="${2:-}"
START_INDEX="${3:-}"

if [[ -z "$SRC" || -z "$SHOT" || -z "$START_INDEX" ]]; then
  echo "Usage: $0 <video_url_or_path> <shot_letter A-E> <start_index>"
  exit 1
fi

FRAMES_PER_SHOT=24
DESKTOP_DIR="public/frames/hero/desktop"
MOBILE_DIR="public/frames/hero/mobile"
SOURCE_DIR="assets/source-videos"
WORK_DIR=$(mktemp -d)

mkdir -p "$DESKTOP_DIR" "$MOBILE_DIR" "$SOURCE_DIR"

if [[ "$SRC" =~ ^https?:// ]]; then
  LOCAL_VIDEO="$SOURCE_DIR/shot_${SHOT}.mp4"
  echo "→ Downloading source video to $LOCAL_VIDEO"
  curl -sSL "$SRC" -o "$LOCAL_VIDEO"
else
  LOCAL_VIDEO="$SRC"
fi

echo "→ Probing duration of $LOCAL_VIDEO"
DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$LOCAL_VIDEO")
FPS_TARGET=$(awk -v d="$DURATION" -v n="$FRAMES_PER_SHOT" 'BEGIN { printf "%.4f", n / d }')
echo "   duration=${DURATION}s, target fps=${FPS_TARGET} (= ${FRAMES_PER_SHOT} frames)"

# Extract desktop frames: 1920x1080, sampled to FRAMES_PER_SHOT
DESKTOP_PATTERN="$WORK_DIR/desktop_%04d.png"
ffmpeg -y -loglevel error -i "$LOCAL_VIDEO" \
  -vf "fps=${FPS_TARGET},scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
  -frames:v "$FRAMES_PER_SHOT" \
  "$DESKTOP_PATTERN"

# Extract mobile frames: 1080x1920 portrait (note: source is landscape — crop to center)
# For mobile, we'll just downsample width to 1080 and keep aspect; this gives a horizontal mobile shot.
# Mobile portrait would need recomposition — we'll handle that in a separate pass if needed.
MOBILE_PATTERN="$WORK_DIR/mobile_%04d.png"
MOBILE_FRAMES_PER_SHOT=12  # 60 total / 5 shots
MOBILE_FPS_TARGET=$(awk -v d="$DURATION" -v n="$MOBILE_FRAMES_PER_SHOT" 'BEGIN { printf "%.4f", n / d }')

ffmpeg -y -loglevel error -i "$LOCAL_VIDEO" \
  -vf "fps=${MOBILE_FPS_TARGET},scale=1280:720" \
  -frames:v "$MOBILE_FRAMES_PER_SHOT" \
  "$MOBILE_PATTERN"

# Convert desktop PNGs → WebP @ q=75, named with global index
echo "→ Encoding desktop frames to WebP (q=75)"
i=0
for f in "$WORK_DIR"/desktop_*.png; do
  GLOBAL_INDEX=$((START_INDEX + i))
  OUT="$DESKTOP_DIR/frame_$(printf '%04d' $GLOBAL_INDEX).webp"
  ffmpeg -y -loglevel error -i "$f" -c:v libwebp -quality 75 -compression_level 6 "$OUT"
  i=$((i + 1))
done

# Convert mobile PNGs → WebP
echo "→ Encoding mobile frames to WebP (q=75)"
MOBILE_START=$((START_INDEX * MOBILE_FRAMES_PER_SHOT / FRAMES_PER_SHOT))
i=0
for f in "$WORK_DIR"/mobile_*.png; do
  GLOBAL_INDEX=$((MOBILE_START + i))
  OUT="$MOBILE_DIR/frame_$(printf '%04d' $GLOBAL_INDEX).webp"
  ffmpeg -y -loglevel error -i "$f" -c:v libwebp -quality 75 -compression_level 6 "$OUT"
  i=$((i + 1))
done

# Cleanup
rm -rf "$WORK_DIR"

DESKTOP_COUNT=$(ls "$DESKTOP_DIR"/frame_*.webp 2>/dev/null | wc -l)
MOBILE_COUNT=$(ls "$MOBILE_DIR"/frame_*.webp 2>/dev/null | wc -l)
DESKTOP_SIZE=$(du -sh "$DESKTOP_DIR" 2>/dev/null | awk '{print $1}')
MOBILE_SIZE=$(du -sh "$MOBILE_DIR" 2>/dev/null | awk '{print $1}')

echo ""
echo "✓ Done."
echo "  Desktop frames: $DESKTOP_COUNT  ($DESKTOP_SIZE)"
echo "  Mobile frames:  $MOBILE_COUNT  ($MOBILE_SIZE)"
echo "  Source kept at: $LOCAL_VIDEO"
