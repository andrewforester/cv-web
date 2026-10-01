#!/usr/bin/env bash
# Renders the package PNGs from mock.html with headless Chromium/Chrome (no Node needed).
# Usage: docs/design/retro/render.sh   (set CHROME=/path/to/chrome to override the browser)
# The mock reads layers/*.css with XHR, hence --allow-file-access-from-files.
# The retro fonts (Verdana, Times New Roman, Comic Sans MS) are the "core fonts for the web" and the
# DevTools console font is Menlo/Consolas: render on macOS or Windows; Linux falls back to other faces.
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
    --force-prefers-reduced-motion --allow-file-access-from-files --window-size="$2,$3" \
    --virtual-time-budget=5000 --screenshot="$PWD/$1" "$MOCK?$4" 2>/dev/null
  echo "$1"
}

# The show, 1280 x 800
shot 01-broken.png 1280 800 'state=broken'
shot 02-chat.png 1280 800 'state=chat'
shot 03-console.png 1280 800 'state=console'
shot 04-step1-mid.png 1280 800 'state=step1-mid'
shot 05-after-step1.png 1280 800 'state=step1'
shot 06-step2-mid.png 1280 800 'state=step2-mid'
shot 07-after-step2.png 1280 800 'state=step2'
shot 08-rest-mid.png 1280 800 'state=rest-mid'
shot 09-finale.png 1280 800 'state=finale'
shot 10-colours-mid.png 1280 800 'state=colours-mid'
shot 11-closing.png 1280 800 'state=closing'
shot 12-end.png 1280 800 'state=end'
# Whole pages without the dock, for the deviation list
shot full-broken.png 1280 3000 'state=broken&dock=0'
shot full-after-step2.png 1280 3000 'state=step2&dock=0'
