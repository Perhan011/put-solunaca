#!/usr/bin/env bash
# Bake a single cinematic still into a span of the hero frame sequence with a
# smooth Ken Burns push-in (used for shots A/B/E now that AI video generation
# is gated behind a paid plan). The scroll-driven frame stepping turns the
# zoom into motion as the visitor scrolls.
#
# Usage:
#   ./scripts/bake-shot-frames.sh <still.png> <desktop_start> <desktop_count> \
#       <mobile_start> <mobile_count> <zoom_end>
#
# Example (shot A, trench):
#   ./scripts/bake-shot-frames.sh shot_A_still.png 0 24 0 12 1.06

set -euo pipefail

SRC="${1:-}"; DSTART="${2:-}"; DCOUNT="${3:-}"; MSTART="${4:-}"; MCOUNT="${5:-}"; ZEND="${6:-}"
if [[ -z "$SRC" || ! -f "$SRC" || -z "$ZEND" ]]; then
  echo "Usage: $0 <still.png> <desktop_start> <desktop_count> <mobile_start> <mobile_count> <zoom_end>"
  exit 1
fi

DESKTOP_DIR="public/frames/hero/desktop"
MOBILE_DIR="public/frames/hero/mobile"
WORK=$(mktemp -d)
mkdir -p "$DESKTOP_DIR" "$MOBILE_DIR"

DINC=$(awk -v z="$ZEND" -v n="$DCOUNT" 'BEGIN{printf "%.6f",(z-1)/n}')
MINC=$(awk -v z="$ZEND" -v n="$MCOUNT" 'BEGIN{printf "%.6f",(z-1)/n}')

echo "→ Desktop: ${DCOUNT} frames @1920x1080, zoom 1.0→${ZEND} (start ${DSTART})"
ffmpeg -y -loglevel error -loop 1 -i "$SRC" \
  -vf "scale=2880:1620:force_original_aspect_ratio=increase,crop=2880:1620,zoompan=z='min(zoom+${DINC},${ZEND})':d=${DCOUNT}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=24" \
  -frames:v "$DCOUNT" "$WORK/d_%04d.png"

echo "→ Mobile: ${MCOUNT} frames @1280x720, zoom 1.0→${ZEND} (start ${MSTART})"
ffmpeg -y -loglevel error -loop 1 -i "$SRC" \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='min(zoom+${MINC},${ZEND})':d=${MCOUNT}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=24" \
  -frames:v "$MCOUNT" "$WORK/m_%04d.png"

echo "→ Encoding desktop WebP (q=75)"
i=0
for f in "$WORK"/d_*.png; do
  gi=$((DSTART + i)); ffmpeg -y -loglevel error -i "$f" -c:v libwebp -quality 75 -compression_level 6 "$DESKTOP_DIR/frame_$(printf '%04d' $gi).webp"; i=$((i + 1))
done

echo "→ Encoding mobile WebP (q=75)"
i=0
for f in "$WORK"/m_*.png; do
  gi=$((MSTART + i)); ffmpeg -y -loglevel error -i "$f" -c:v libwebp -quality 75 -compression_level 6 "$MOBILE_DIR/frame_$(printf '%04d' $gi).webp"; i=$((i + 1))
done

rm -rf "$WORK"
echo "✓ Baked $(basename "$SRC") → desktop ${DSTART}..$((DSTART+DCOUNT-1)), mobile ${MSTART}..$((MSTART+MCOUNT-1))"
