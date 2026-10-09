#!/usr/bin/env bash
# Renders the package screenshots from mock.html with headless Chrome/Chromium; the strips and
# screenshot.png are composed with python3 + Pillow.
# Usage: docs/design/chat-disclaimer/render.sh   (set CHROME=/path/to/chrome to override)
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

# Panel = the overlay at 1280 x 800 (the slide only moves the page; the panel is the same).
laptop() { # <out.png> <query>
  "$CHROME" "${FLAGS[@]}" --window-size=1280,800 --screenshot="$PWD/$1" "$MOCK?$2" 2>/dev/null
  echo "$1"
}

# Headless Chrome won't make a window narrower than ~500 px, so phone shots go through
# frame.html, which hosts the mock in an iframe of the exact size.
mobile() { # <out.png> <query>
  local q="${2//=/%3D}"
  "$CHROME" "${FLAGS[@]}" --window-size=600,844 --screenshot="$PWD/$1" \
    "file://$PWD/frame.html?w=390&h=844&q=${q//&/%26}" 2>/dev/null
  # frame.html centres the iframe, so a centre crop keeps exactly the phone viewport.
  if command -v sips >/dev/null; then sips -c 844 390 "$PWD/$1" >/dev/null
  else convert "$PWD/$1" -gravity center -crop 390x844+0+0 +repage "$PWD/$1"; fi
  echo "$1"
}

for s in text call; do
  laptop "assets/disclaimer_today_${s}_laptop.png" "variant=today&state=$s"
  mobile "assets/disclaimer_today_${s}_mobile.png" "variant=today&state=$s"
done
for v in a b; do
  for s in empty text counter toolong connecting call callChat ended; do
    laptop "assets/disclaimer_${v}_${s}_laptop.png" "variant=$v&state=$s"
    mobile "assets/disclaimer_${v}_${s}_mobile.png" "variant=$v&state=$s"
  done
done

# The strips: the bottom of the panel / sheet in text, connecting, call and callChat side by side,
# with ?guide (a dashed line along the composer row's bottom edge). A straight line = the row
# stays put; steps = it jumps.
if command -v python3 >/dev/null && python3 -c 'import PIL' 2>/dev/null; then
  STATES=(text connecting call callChat)
  for v in today a b; do
    for s in "${STATES[@]}"; do
      laptop ".strip_${v}_${s}_laptop.png" "variant=$v&state=$s&guide" >/dev/null
      mobile ".strip_${v}_${s}_mobile.png" "variant=$v&state=$s&guide" >/dev/null
    done
  done
  python3 - "${STATES[@]}" <<'PY'
import sys
from PIL import Image, ImageDraw, ImageFont
states = sys.argv[1:]
names = {'today': 'Today (built)', 'a': 'Variant A: one line in every surface',
         'b': 'Variant B: said once, at the start'}
font = ImageFont.load_default(size=18)
small = ImageFont.load_default(size=15)
# The bottom of the panel (1280 x 800: the panel spans x 864-1264, y 184-784) and of the sheet.
boxes = {'laptop': (848, 480, 1280, 800), 'mobile': (0, 524, 390, 844)}
band, gap = 26, 8

def strip(v, form):
    box = boxes[form]
    w, h = box[2] - box[0], box[3] - box[1]
    sheet = Image.new('RGB', (len(states) * (w + gap) - gap, h + band), 'white')
    draw = ImageDraw.Draw(sheet)
    for i, s in enumerate(states):
        tile = Image.open(f'.strip_{v}_{s}_{form}.png').convert('RGB').crop(box)
        sheet.paste(tile, (i * (w + gap), band))
        draw.text((i * (w + gap) + 8, 4), s, fill='black', font=small)
    return sheet

for form in boxes:
    for v in names:
        strip(v, form).save(f'assets/disclaimer_strip_{v}_{form}.png', optimize=True)
        print(f'assets/disclaimer_strip_{v}_{form}.png')

# screenshot.png: the three panel strips stacked, with titles.
rows = [strip(v, 'laptop') for v in names]
title = 34
out = Image.new('RGB', (rows[0].width, sum(r.height + title for r in rows)), 'white')
y = 0
for v, r in zip(names, rows):
    ImageDraw.Draw(out).text((8, y + 8), names[v], fill='black', font=font)
    out.paste(r, (0, y + title))
    y += r.height + title
out.save('screenshot.png', optimize=True)
print('screenshot.png')
PY
  rm -f .strip_*.png
fi

# Optional: shrink the renders. Set PNGQUANT=/path/to/pngquant if it is not on PATH.
PNGQUANT="${PNGQUANT:-$(command -v pngquant || true)}"
if [[ -n "$PNGQUANT" ]]; then
  "$PNGQUANT" --quality=80-98 --speed 1 --force --ext .png screenshot.png assets/disclaimer_*.png
fi
