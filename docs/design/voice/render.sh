#!/usr/bin/env bash
# Renders the package screenshots from mock.html with headless Chrome/Chromium (no Node needed).
# Usage: docs/design/voice/render.sh   (set CHROME=/path/to/chrome to override the browser)
# Motion runs (no reduced motion): each frame is taken at the same virtual time, so renders are
# stable; the reduced-motion look is described in SPEC.md → Motion.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-}"
if [[ -z "$CHROME" ]]; then
  for candidate in /opt/pw-browsers/chromium \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "$(command -v chromium || true)" "$(command -v google-chrome || true)"; do
    if [[ -n "$candidate" && -f "$candidate" && -x "$candidate" ]]; then CHROME="$candidate"; break; fi
  done
fi
[[ -n "$CHROME" ]] || { echo "No Chrome/Chromium found; set CHROME=" >&2; exit 1; }

MOCK="file://$PWD/mock.html"
FLAGS=(--headless=new --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=4000
  --allow-file-access-from-files)

desktop() { # <out.png> <state>
  "$CHROME" "${FLAGS[@]}" --window-size=1280,800 --screenshot="$PWD/$1" "$MOCK?state=$2" 2>/dev/null
  echo "$1"
}

# Headless Chrome won't make a window narrower than ~500 px, so phone shots go through
# frame.html, which hosts the mock in an iframe of the exact size.
mobile() { # <out.png> <state>
  "$CHROME" "${FLAGS[@]}" --window-size=600,844 --screenshot="$PWD/$1" \
    "file://$PWD/frame.html?w=390&h=844&q=state%3D$2" 2>/dev/null
  # frame.html centres the iframe, so a centre crop keeps exactly the phone viewport.
  if command -v sips >/dev/null; then sips -c 844 390 "$PWD/$1" >/dev/null
  else convert "$PWD/$1" -gravity center -crop 390x844+0+0 +repage "$PWD/$1"; fi
  echo "$1"
}

desktop screenshot.png listening
for s in launcher text connecting listening speaking muted typed tool confirm warning chat minimized ended \
  error-denied error-failed error-busy error-ratelimited error-dropped error-callcap error-monthly offline; do
  desktop "assets/voice_state_${s}_desktop.png" "$s"
  mobile "assets/voice_state_${s}_mobile.png" "$s"
done

# Optional: shrink the renders (the orb's gradients need dithering, so pngquant, not a plain
# palette). Set PNGQUANT=/path/to/pngquant if it is not on PATH.
PNGQUANT="${PNGQUANT:-$(command -v pngquant || true)}"
if [[ -n "$PNGQUANT" ]]; then
  "$PNGQUANT" --quality=80-98 --speed 1 --force --ext .png screenshot.png assets/voice_state_*.png
fi
