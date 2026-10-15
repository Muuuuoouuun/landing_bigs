#!/usr/bin/env bash
# Storyboard sheets for the docs: renders key beats as stills and tiles them with timecodes.
#   bash render/storyboard.sh
set -euo pipefail
cd "$(dirname "$0")/.."
TIMES="0.06,0.17,0.45,1.20,2.50,3.30,3.90,4.88,5.40,6.98,7.25,7.60,8.25,8.95,9.90,10.55,11.30,12.20,12.90,13.70,14.95,16.20,17.40,18.40,19.90,21.10,22.60,23.75,24.60,27.40"
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
  if [ "$FMT" = 16x9 ]; then TILE=5x6; else TILE=10x3; fi
  ffmpeg -v error -y -start_number 1 -i "$TMP/$FMT/n_%02d.jpg" -frames:v 1 -vf "tile=${TILE}:padding=4:color=0x0b0f0d" "docs/storyboard/storyboard_${FMT}.jpg"
done
rm -r "$TMP"
echo "→ docs/storyboard/storyboard_16x9.jpg, storyboard_9x16.jpg"
