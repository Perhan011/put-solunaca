#!/usr/bin/env bash
# Bake a single still map image into the hero frame sequence for the map
# segment (shots C + D). Adds a very subtle, centered Ken Burns zoom so the
# background has a little life while the route overlay draws on top.
#
# Usage:
#   ./scripts/bake-map-frames.sh <map_image_path>
#
# Writes:
#   desktop frame_0048.webp .. frame_0095.webp   (48 frames, 1920x1080)
#   mobile  frame_0024.webp .. frame_0047.webp   (24 frames, 1280x720)

set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "Usage: $0 <map_image_path>"
  exit 1
fi

DESKTOP_DIR="public/frames/hero/desktop"
MOBILE_DIR="public/frames/hero/mobile"
WORK_DIR=$(mktemp -d)
mkdir -p "$DESKTOP_DIR" "$MOBILE_DIR"

DESKTOP_FRAMES=48   # indices 48..95  (shots C + D)
DESKTOP_START=48
MOBILE_FRAMES=24    # indices 24..47
MOBILE_START=24

# Subtle centered zoom: 1.00 -> ~1.045 across the segment.
ZOOM_DESKTOP="min(zoom+0.00094,1.045)"
ZOOM_MOBILE="min(zoom+0.00188,1.045)"

echo "→ Desktop: rendering ${DESKTOP_FRAMES} zoom frames (1920x1080)"
ffmpeg -y -loglevel error -loop 1 -i "$SRC" \
  -vf "scale=2880:1620:force_original_aspect_ratio=increase,crop=2880:1620,zoompan=z='${ZOOM_DESKTOP}':d=${DESKTOP_FRAMES}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=24" \
  -frames:v "$DESKTOP_FRAMES" \
  "$WORK_DIR/desk_%04d.png"

echo "→ Mobile: rendering ${MOBILE_FRAMES} zoom frames (1280x720)"
ffmpeg -y -loglevel error -loop 1 -i "$SRC" \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='${ZOOM_MOBILE}':d=${MOBILE_FRAMES}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=24" \
  -frames:v "$MOBILE_FRAMES" \
  "$WORK_DIR/mob_%04d.png"

echo "→ Encoding desktop frames to WebP (q=75)"
i=0
for f in "$WORK_DIR"/desk_*.png; do
  GLOBAL_INDEX=$((DESKTOP_START + i))
  OUT="$DESKTOP_DIR/frame_$(printf '%04d' $GLOBAL_INDEX).webp"
  ffmpeg -y -loglevel error -i "$f" -c:v libwebp -quality 75 -compression_level 6 "$OUT"
  i=$((i + 1))
done

echo "→ Encoding mobile frames to WebP (q=75)"
i=0
for f in "$WORK_DIR"/mob_*.png; do
  GLOBAL_INDEX=$((MOBILE_START + i))
  OUT="$MOBILE_DIR/frame_$(printf '%04d' $GLOBAL_INDEX).webp"
  ffmpeg -y -loglevel error -i "$f" -c:v libwebp -quality 75 -compression_level 6 "$OUT"
  i=$((i + 1))
done

rm -rf "$WORK_DIR"

echo ""
echo "✓ Map frames baked."
echo "  Desktop: ${DESKTOP_START}..$((DESKTOP_START + DESKTOP_FRAMES - 1))"
echo "  Mobile:  ${MOBILE_START}..$((MOBILE_START + MOBILE_FRAMES - 1))"
