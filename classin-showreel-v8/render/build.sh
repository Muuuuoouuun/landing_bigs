#!/usr/bin/env bash
# Full pipeline: frames (both formats) → score + SFX → encode.  bash render/build.sh [workers]
set -euo pipefail
cd "$(dirname "$0")/.."
WK="${1:-3}"
node render/render.mjs --fmt 16x9 --fps 60 --sub 2 --workers "$WK"
python3 render/audio.py
bash render/encode.sh 16x9
node render/render.mjs --fmt 9x16 --fps 60 --sub 2 --workers "$WK"
bash render/encode.sh 9x16
