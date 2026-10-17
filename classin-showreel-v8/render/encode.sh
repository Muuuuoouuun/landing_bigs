#!/usr/bin/env bash
# Blend motion-blur sub-frames, add fine grain, master the audio to −14 LUFS / −1.25 dBTP and mux.
#   bash render/encode.sh [16x9|9x16]
set -euo pipefail
cd "$(dirname "$0")/.."
FMT="${1:-16x9}"
DIR="out/frames_${FMT}"
read -r FPS SUB < <(python3 -c "import json;d=json.load(open('$DIR/render.json'));print(d['fps'],d['sub'])")
OUT="out/classin_showreel_${FMT}.mp4"

# picture: average each frame's SUB sub-frames (shutter blur), then fine luma grain
if [ "$SUB" -gt 1 ]; then
  BLUR="tmix=frames=${SUB},select='eq(mod(n\,${SUB})\,$((SUB - 1)))',setpts=N/(${FPS}*TB),"
else
  BLUR=""
fi
# v8 finish: a soft halation off the highlights (warm), a gentle S-curve, a vignette, then fine grain
GRADE="format=rgb24,split=2[a][b];[b]curves=all='0/0 0.55/0 1/1',gblur=sigma=26,colorchannelmixer=rr=1:gg=0.72:bb=0.42[h];[a][h]blend=all_mode=screen:all_opacity=0.32,curves=all='0/0.02 0.25/0.215 0.75/0.79 1/0.98',vignette=PI/7.5"
FC="[0:v]${BLUR}${GRADE},noise=c0s=4:c0f=t+u,format=yuv420p[v]"

# audio: two-pass loudnorm
MEAS=$(ffmpeg -hide_banner -nostats -i out/audio.wav -af loudnorm=I=-14:TP=-1.25:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$MEAS" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
AF="loudnorm=I=-14:TP=-2.2:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,alimiter=limit=0.76:attack=1:release=60:level=disabled"

# constant 60 fps, high-profile H.264; a VBV cap keeps the grain from ballooning the file
ffmpeg -hide_banner -nostats -loglevel warning -y -framerate $((FPS * SUB)) -i "$DIR/f%06d.jpg" -i out/audio.wav \
  -filter_complex "$FC" -map "[v]" -map 1:a -r "$FPS" -fps_mode cfr -c:v libx264 -preset slow -crf 19 -maxrate 10M -bufsize 20M -profile:v high -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -af "$AF" -ar 48000 -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
echo "→ $OUT"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
