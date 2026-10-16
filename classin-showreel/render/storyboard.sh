#!/usr/bin/env bash
# Storyboard sheets for the docs: renders key beats as stills and tiles them with timecodes.
#   bash render/storyboard.sh
set -euo pipefail
cd "$(dirname "$0")/.."
TIMES="0.10,0.24,0.80,1.20,1.80,2.60,3.20,3.90,4.40,5.20,6.20,7.40,8.45,9.62,10.40,11.30,12.40,13.80,14.40,15.20,16.30,16.90,17.50,18.60,19.80,21.20,23.70,24.20,25.40,27.60"
TMP="$(mktemp -d)"
FONT="$(fc-match -f '%{file}' 'Inter:bold' 2>/dev/null || true)"
for FMT in 16x9 9x16; do
  node render/render.mjs --fmt "$FMT" --stills "$TIMES" --out "$TMP/$FMT" --prefix sb_
  i=1
  for f in $(ls "$TMP/$FMT"/sb_*.jpg | sort -t_ -k2 -g); do
    t="$(basename "$f" .jpg | cut -d_ -f2)"
    if [ "$FMT" = 16x9 ]; then SC=480; else SC=216; fi
    ffmpeg -v error -y -i "$f" -vf "scale=${SC}:-1,drawtext=fontfile=${FONT}:text='$(printf %02d $i)  ${t}s':x=8:y=8:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=4" "$TMP/$FMT/n_$(printf %02d $i).jpg"
    i=$((i + 1))
  done
  if [ "$FMT" = 16x9 ]; then TILE=5x6; else TILE=10x3; fi
  ffmpeg -v error -y -start_number 1 -i "$TMP/$FMT/n_%02d.jpg" -frames:v 1 -vf "tile=${TILE}:padding=4:color=0xE9E2D2" "docs/storyboard/storyboard_${FMT}.jpg"
done
rm -r "$TMP"
echo "→ docs/storyboard/storyboard_16x9.jpg, storyboard_9x16.jpg"
