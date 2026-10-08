#!/usr/bin/env bash
# Renders the package screenshots from mock.html with headless Chrome/Chromium (no Node needed).
# Usage: docs/design/stackoverflow/render.sh   (set CHROME=/path/to/chrome to override the browser)
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

FLAGS=(--headless=new --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=4000
  --allow-file-access-from-files)

# Headless Chrome won't make a window narrower than ~500 px, so every shot goes through
# frame.html, which hosts the mock in an iframe of the exact size; a centre crop keeps it.
shot() { # <out.png> <width> <height> <state>
  local w=$2 h=$3 win=$(( $2 < 600 ? 600 : $2 ))
  "$CHROME" "${FLAGS[@]}" --window-size="$win,$h" --screenshot="$PWD/$1" \
    "file://$PWD/frame.html?w=$w&h=$h&q=state%3D$4" 2>/dev/null
  if (( win != w )); then
    if command -v sips >/dev/null; then sips -c "$h" "$w" "$PWD/$1" >/dev/null
    else convert "$PWD/$1" -gravity center -crop "${w}x${h}+0+0" +repage "$PWD/$1"; fi
  fi
  echo "$1"
}

shot screenshot.png 1280 760 default
shot assets/stackoverflow_mobile.png 390 1200 default
for s in big notags nobadges hover empty; do
  shot "assets/stackoverflow_state_${s}_desktop.png" 1280 760 "$s"
done
shot assets/stackoverflow_state_big_mobile.png 390 1280 big
shot assets/stackoverflow_state_notags_mobile.png 390 1100 notags
shot assets/stackoverflow_tablet_900.png 900 1060 default
