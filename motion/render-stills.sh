#!/usr/bin/env bash
# Usage: ./render-stills.sh <CompositionId> <frame> [frame...]
# Set REMOTION_BROWSER to use a preinstalled Chrome headless shell.
set -euo pipefail
cd "$(dirname "$0")"
comp="$1"; shift
mkdir -p out/stills
args=()
[[ -n "${REMOTION_BROWSER:-}" ]] && args+=(--browser-executable="$REMOTION_BROWSER")
for f in "$@"; do
  npx remotion still src/index.js "$comp" "out/stills/${comp}-${f}.png" --frame="$f" --log=error "${args[@]}"
done
