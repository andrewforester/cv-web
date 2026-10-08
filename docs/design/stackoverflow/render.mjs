// Renders the package PNGs: the real built page (dist/) with the compact card (card.css, card.js)
// injected at each placement option. Not product code.
// Usage: npm run build && node docs/design/stackoverflow/render.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const here = new URL('.', import.meta.url).pathname;
const dist = join(here, '../../../dist');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

// A static server for dist/ (the SPA answers index.html for unknown paths).
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path === '/' ? 'index.html' : path;
  const body = await readFile(join(dist, file)).catch(() => readFile(join(dist, 'index.html')));
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'text/html' });
  res.end(body);
}).listen(0);
const origin = `http://localhost:${server.address().port}`;

const css = await readFile(join(here, 'card.css'), 'utf8');
const js = await readFile(join(here, 'card.js'), 'utf8');

// Runs in the page: puts the card at placement `option` and returns the clip to capture.
function place({ option, state }) {
  const q = (id) => document.querySelector(`[data-testid="${id}"]`);
  const column = (style) => {
    const div = document.createElement('div');
    Object.assign(div.style, { display: 'flex', flexDirection: 'column', minWidth: '0' }, style);
    return div;
  };
  const box = (el) => el.getBoundingClientRect();
  const y = (el, edge) => box(el)[edge] + window.scrollY;
  const width = document.documentElement.clientWidth;
  // Option 2 is a full-width strip: one row from 1000 px (SPEC → Placement options).
  const card = window.stackOverflowCard(state, {
    tint: option === 3,
    wide: option === 2 && width >= 1000,
  });

  if (option === 1) {
    // Under the 2×2 stat tiles, in the summary's right column.
    const stats = q('home-stat').parentElement;
    const col = column({ flex: '1 1 280px', gap: 'var(--space-2)' });
    stats.before(col);
    stats.style.flex = 'none'; // its `flex: 1 1 280px` moves to the column
    col.append(stats, card);
    const header = q('home-header');
    if (state !== 'default') {
      const top = y(stats, 'top') - 16;
      return { x: 0, y: top, width, height: y(card, 'bottom') + 16 - top };
    }
    return { x: 0, y: y(header, 'top') - 24, width, height: box(header).height + 48 };
  }
  if (option === 2) {
    // The last block of Experience, after the jobs.
    const experience = q('home-experience');
    experience.append(card);
    const jobs = experience.querySelectorAll('[data-testid="home-job"]');
    const top = y(jobs[jobs.length - 1], 'top') - 24;
    return { x: 0, y: top, width, height: y(q('home-education'), 'top') + 120 - top };
  }
  // option 3: in the footer CTA, under "Let's build something".
  const footer = q('home-footer');
  const title = footer.querySelector('h2');
  const col = column({ flex: '1 1 300px', gap: 'var(--space-5)' });
  title.before(col);
  title.style.flex = 'none'; // its `flex: 1 1 300px` moves to the column
  col.append(title, card);
  const top = y(q('home-education'), 'bottom') - 80;
  return { x: 0, y: top, width, height: y(q('home-copyright'), 'bottom') + 40 - top };
}

const shots = [
  ...[1, 2, 3].flatMap((option) => [
    { out: `assets/stackoverflow_option_${option}_desktop.png`, width: 1280, option },
    { out: `assets/stackoverflow_option_${option}_mobile.png`, width: 390, option },
  ]),
  { out: 'screenshot.png', width: 1280, option: 1 },
  ...['big', 'notags', 'nobadges', 'hover'].map((state) => ({
    out: `assets/stackoverflow_state_${state}_desktop.png`,
    width: 1280,
    option: 1,
    state,
  })),
  { out: 'assets/stackoverflow_state_big_mobile.png', width: 390, option: 1, state: 'big' },
];

const browser = await chromium.launch();
for (const { out, width, option, state = 'default' } of shots) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(origin);
  await page.waitForSelector('[data-testid="home-footer"]');
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: js });
  // The floating chat button would cover the placements; it isn't part of them.
  await page.addStyleTag({ content: '[data-testid="chat-fab"] { display: none !important; }' });
  await page.evaluate(() => document.fonts.ready);
  const before = await page.evaluate(() => document.documentElement.scrollHeight);
  const clip = await page.evaluate(place, { option, state });
  const card = await page.locator('.so').boundingBox();
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.screenshot({ path: join(here, out), clip, fullPage: true });
  await page.close();
  console.log(
    `${out}: card ${Math.round(card.width)}×${Math.round(card.height)}, page +${pageHeight - before} px`,
  );
}
await browser.close();
server.close();
