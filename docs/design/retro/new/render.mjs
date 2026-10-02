// Renders the broken 2001 `/new` (docs/design/retro/SPEC.md → 2001 `/new`) from the real page:
// it opens the built `/new`, puts the stage on the shell's wrapper, injects every damage layer of
// the `/new` scenario (the shared files from src/screens/retro/layers/ and the /new-only ones
// next to this script) and the three decorations with the `/new` copy, as the show will at t = 0.
// It also fails when a layer selector matches nothing (a quick guard 2 on today's markup).
//
// Usage (repo root): npm run build && npx vite preview --port 4391 --strictPort &
//                    node docs/design/retro/new/render.mjs   (BASE_URL overrides the server)
// Render on macOS or Windows: the retro faces are the "core fonts for the web" (SPEC → Source).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../../../..');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4391';

// The `/new` scenario's 32 layers in show order: [id, folder] (SPEC → 2001 `/new` → Damage layers).
const SHARED = 'src/screens/retro/layers';
const NEW = 'docs/design/retro/new/layers';
const LAYERS = [
  ['type-faces', SHARED],
  ['type-family', SHARED],
  ['type-scale-headings', SHARED],
  ['type-scale-text', SHARED],
  ['type-scale-impact', NEW],
  ['type-scale-cards', SHARED],
  ['type-scale-details', SHARED],
  ['page-background', SHARED],
  ['base-colors', SHARED],
  ['heading-colors', NEW],
  ['panel-colors', NEW],
  ['page-frame', NEW],
  ['header-layout', SHARED],
  ['impact-grid', NEW],
  ['experience-heads', SHARED],
  ['skills-grid', NEW],
  ['broken-photo', SHARED],
  ['squashed-icons', SHARED],
  ['broken-covers', NEW],
  ['impact-cells', NEW],
  ['loop-frame', NEW],
  ['app-cells', SHARED],
  ['tech-cells', SHARED],
  ['card-colors', SHARED],
  ['heading-rules', NEW],
  ['bullets', NEW],
  ['card-padding', NEW],
  ['new-bursts', NEW],
  ['decor-room', NEW],
  ['hide-meta-bar', SHARED],
  ['link-style', SHARED],
  ['contact-labels', NEW],
];

const read = (path) => readFileSync(join(repo, path), 'utf8');
const svg = (name) =>
  `url("data:image/svg+xml;base64,${Buffer.from(read(`src/screens/retro/assets/${name}`)).toString('base64')}")`;
const asset = (name) => svg(name).slice(5, -2);

const layers = LAYERS.map(([id, folder]) => ({ id, css: read(`${folder}/${id}.css`) }));
const decorationsCss = read('src/screens/retro/Decorations.module.css');
const hostCss = `:root {
  --retro-broken-image: ${svg('retro_icon_broken_image.svg')};
  --retro-tile-stars: ${svg('retro_tile_stars.svg')};
  --retro-badge-new: ${svg('retro_badge_new.svg')};
}`;

// The decorations' `/new` copy (SPEC → 2001 `/new` → Texts); the markup mirrors TopBar,
// PageFooter and OhSnapNote.
const COPY = {
  nav: ['Home', 'Resume', 'Impact', 'My Apps', 'Guestbook', 'Links'],
  marquee:
    '*** Welcome to my homepage! *** AI Product Engineer *** Mobile &amp; Agentic Systems *** Please sign my guestbook! ***',
  webring: 'AI Builders Webring',
};
const DECORATIONS = {
  'top-bar': `<div class="topBar"><div class="nav">${COPY.nav
    .map((item) => `<span class="navItem">${item}</span>`)
    .join(
      '',
    )}</div><div class="marquee"><span class="marqueeText">${COPY.marquee}</span></div></div>`,
  'page-footer': `<div class="footer"><img src="${asset('retro_sign_under_construction.svg')}" alt="" width="208" height="40">
    <p>You are visitor number <span class="counter">${[...'004271']
      .map((digit) => `<span class="digit">${digit}</span>`)
      .join('')}</span></p>
    <p><img class="badge" src="${asset('retro_badge_800x600.svg')}" alt="" width="88" height="31"><img class="badge" src="${asset('retro_badge_guestbook.svg')}" alt="" width="88" height="31"></p>
    <p>[ <span class="fakeLink">&lt;&lt; Prev</span> | <span class="fakeLink">${COPY.webring}</span> | <span class="fakeLink">Next &gt;&gt;</span> ]</p>
    <p>Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.</p></div>`,
  'oh-snap': `<strong class="noteTitle">Oh, snap!</strong>Some pictures didn't load. Try pressing F5... or just wait a minute.`,
};

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  locale: 'en-US',
  reducedMotion: 'reduce',
});
await page.goto(`${BASE_URL}/new?retro=0`);
await page.getByTestId('forest-name').waitFor();
await page.evaluate(() => document.fonts.ready);

const missing = await page.evaluate(
  ({ layers, hostCss, decorationsCss, decorations }) => {
    // The shell's stage: the wrapper around <main>; the AI chat is off the page during the show.
    const stage = document.querySelector('main').parentElement;
    stage.setAttribute('data-retro-stage', '');
    for (const element of stage.children) if (element.tagName !== 'MAIN') element.remove();
    document.title = 'Andrew Panasiuk - Homepage';

    const add = (css, attribute) => {
      const style = document.createElement('style');
      style.textContent = css;
      if (attribute) style.setAttribute(...attribute);
      document.head.append(style);
      return style;
    };
    add(hostCss, ['data-retro-host', '']);
    add(decorationsCss);
    const sheets = layers.map(({ id, css }) => add(css, ['data-retro-layer', id]));

    // Every selector of every rule layer matches the page (pseudo-elements stripped).
    const unmatched = [];
    sheets.forEach((style, index) => {
      for (const rule of style.sheet.cssRules) {
        if (!rule.selectorText) continue;
        const selector = rule.selectorText.replace(/::(before|after)\b/g, '');
        if (!document.querySelector(selector)) unmatched.push(`${layers[index].id}: ${selector}`);
      }
    });

    // Decorations, placed as useDecorationPlacement does (SPEC → Decorations), on /new's hooks.
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { left: rect.left + scrollX, top: rect.top + scrollY, width: rect.width, rect };
    };
    const root = box("[data-retro-stage] [data-testid='profile']");
    const main = box('[data-retro-stage] main');
    const header = box("[data-retro-stage] [data-testid='profile-header']");
    const places = {
      'top-bar': { left: root.left, top: root.top, width: root.width },
      'page-footer': { left: root.left, top: root.top + root.rect.height - 200, width: root.width },
      'oh-snap': { left: main.left + main.width + 28, top: header.top + 40 },
    };
    for (const [id, html] of Object.entries(decorations)) {
      const element = document.createElement('div');
      element.id = id;
      element.className = `decoration${id === 'oh-snap' ? ' note' : ''}`;
      element.setAttribute('aria-hidden', 'true');
      element.innerHTML = html;
      const { left, top, width } = places[id];
      Object.assign(element.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: width ? `${width}px` : '',
      });
      document.body.append(element);
    }
    return unmatched;
  },
  { layers, hostCss, decorationsCss, decorations: DECORATIONS },
);

await page.waitForTimeout(500);
await page.screenshot({ path: join(here, 'screenshot.png') });
await page.screenshot({ path: join(here, 'screenshot-full.png'), fullPage: true });
await browser.close();

if (missing.length) {
  console.error(`Selectors that match nothing on /new:\n${missing.join('\n')}`);
  process.exit(1);
}
console.log('screenshot.png, screenshot-full.png: every layer selector matches /new');
