#!/usr/bin/env bash
# Storyboard sheets for the docs: renders key beats as stills and tiles them with timecodes.
#   bash render/storyboard.sh
set -euo pipefail
cd "$(dirname "$0")/.."
TIMES="0.06,0.17,0.45,1.20,2.45,3.10,4.20,4.65,5.80,6.30,9.40,11.90,13.60,14.85,15.80,18.70,19.85,20.80,21.45,22.60,24.20,25.60"
TMP="$(mktemp -d)"
FONT="$(fc-match -f '%{file}' 'Inter:bold' 2>/dev/null || true)"
for FMT in 16x9 9x16; do
  node render/render.mjs --fmt "$FMT" --stills "$TIMES" --out "$TMP/$FMT" --prefix sb_
  i=1
  for f in $(ls "$TMP/$FMT"/sb_*.jpg | sort -t_ -k2 -g); do
    t="$(basename "$f" .jpg | cut -d_ -f2)"
    if [ "$FMT" = 16x9 ]; then SC=480; else SC=216; fi
    ffmpeg -v error -y -i "$f" -vf "scale=${SC}:-1,drawtext=fontfile=${FONT}:text='$(printf %02d $i)  ${t}s':x=8:y=8:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=4" "$TMP/$FMT/n_$(printf %02d $i).jpg"
    i=$((i + 1))
  done
  if [ "$FMT" = 16x9 ]; then TILE=4x6; else TILE=11x2; fi
  ffmpeg -v error -y -start_number 1 -i "$TMP/$FMT/n_%02d.jpg" -frames:v 1 -vf "tile=${TILE}:padding=4:color=0x0b0f0d" "docs/storyboard/storyboard_${FMT}.jpg"
done
rm -r "$TMP"
echo "→ docs/storyboard/storyboard_16x9.jpg, storyboard_9x16.jpg"
