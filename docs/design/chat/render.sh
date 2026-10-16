#!/usr/bin/env bash
# Renders the package screenshots from mock.html with headless Chromium/Chrome (no Node needed).
# Usage: docs/design/chat/render.sh   (set CHROME=/path/to/chrome to override the browser)
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

shot() { # <out.png> <width> <height> <query>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --force-prefers-reduced-motion --window-size="$2,$3" --virtual-time-budget=5000 \
    --screenshot="$PWD/$1" "$MOCK?$4" 2>/dev/null
  echo "$1"
}

# Headless Chrome won't make a window narrower than ~500 px, so phone shots go through
# frame.html, which hosts the mock in an iframe of the exact size.
mobile() { # <out.png> <query>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --force-prefers-reduced-motion --window-size=600,844 --virtual-time-budget=5000 \
    --screenshot="$PWD/$1" "file://$PWD/frame.html?w=390&h=844&q=$(printf '%s' "$2" | sed 's/=/%3D/g; s/&/%26/g')" 2>/dev/null
  # frame.html centres the iframe, so a centre crop keeps exactly the phone viewport.
  if command -v sips >/dev/null; then sips -c 844 390 "$PWD/$1" >/dev/null
  else convert "$PWD/$1" -gravity center -crop 390x844+0+0 +repage "$PWD/$1"; fi
  echo "$1"
}

shot screenshot.png 1280 800 'state=streaming'
mobile screenshot-mobile.png 'state=streaming'
shot state-launcher.png 1280 800 'state=launcher'
shot state-empty.png 1280 800 'state=empty'
shot state-typing.png 1280 800 'state=typing'
shot state-errors.png 1280 800 'state=errors'
shot state-offline-too-long.png 1280 800 'state=offline'
