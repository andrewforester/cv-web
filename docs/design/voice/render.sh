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

# Desktop = the slide (>= 1584 px): 1600 x 900. Laptop = the overlay (600-1583 px): 1280 x 800.
# The panel floats bottom-right at both; on desktop the page behind it is slid left.
desktop() { # <out.png> <state>
  "$CHROME" "${FLAGS[@]}" --window-size=1600,900 --screenshot="$PWD/$1" "$MOCK?state=$2" 2>/dev/null
  echo "$1"
}

laptop() { # <out.png> <state>
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
for s in text listening chat tool; do
  laptop "assets/voice_state_${s}_laptop.png" "$s"
done

# The morph as filmstrips (desktop, the page slides with it): mock.html?play&at=<ms> freezes it.
# Composed with python3 + Pillow; skipped without them.
morph() { # <out.png> <query> <ms...>
  local out="$1" query="$2"; shift 2
  local frames=()
  for ms in "$@"; do
    "$CHROME" "${FLAGS[@]}" --window-size=1600,900 --screenshot="$PWD/.morph_$ms.png" \
      "$MOCK?$query&at=$ms" 2>/dev/null
    frames+=("$ms")
  done
  python3 - "$out" "${frames[@]}" <<'PY' && echo "$out"
import sys
from PIL import Image, ImageDraw, ImageFont
out, frames = sys.argv[1], sys.argv[2:]
# The bottom-right of the viewport: the panel, the pill and the card's right part.
box, scale, band = (760, 180, 1600, 900), 2 / 3, 32
w, h = int((box[2] - box[0]) * scale), int((box[3] - box[1]) * scale)
cols = 3
rows = (len(frames) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + band)), 'white')
font = ImageFont.load_default(size=20)
for i, ms in enumerate(frames):
    tile = Image.open(f'.morph_{ms}.png').convert('RGB').crop(box).resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * (h + band)
    sheet.paste(tile, (x, y + band))
    ImageDraw.Draw(sheet).text((x + 12, y + 6), f'{ms} ms', fill='black', font=font)
sheet.save(out, optimize=True)
PY
  rm -f "$PWD"/.morph_*.png
}
if command -v python3 >/dev/null && python3 -c 'import PIL' 2>/dev/null; then
  morph assets/voice_morph_open_desktop.png 'state=text&play' 0 100 200 300 500 650
  morph assets/voice_morph_minimize_desktop.png 'state=listening&play=close' 0 80 160 240 320 400
fi

# Optional: shrink the renders (the orb's gradients need dithering, so pngquant, not a plain
# palette). Set PNGQUANT=/path/to/pngquant if it is not on PATH.
PNGQUANT="${PNGQUANT:-$(command -v pngquant || true)}"
if [[ -n "$PNGQUANT" ]]; then
  "$PNGQUANT" --quality=80-98 --speed 1 --force --ext .png screenshot.png assets/voice_state_*.png \
    assets/voice_morph_*.png
fi
