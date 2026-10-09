# home

Why it exists: the one CV page of the site (design `docs/design/v3/`, ADR-0006): Andrew as a
Senior Software Product Engineer, with the stats and contacts up top, skills (right after the
header: the human's call, CV-145; a test locks the order), code craft × agentic process, how he
builds with agents, selected impact, experience (Transcenda's client projects on a tree), education, about me and a closing call to action. It replaced both older pages: the
app shell shows it on every path, and `/new` redirects here on Vercel.

Place in the architecture: the screen pattern of the root `AGENTS.md` over `CvPageRepository`
(`src/data`, mocked by `src/data/cv/cvPage.json`, English only). The state holder loads the page
and owns the page agent's highlight; the stateless screen renders the page's blocks with
components that live in this folder (one screen uses them). All content about Andrew is data;
section headings and fixed words (the handle, "Email me", ©) are this screen's strings. The look
is not data: card tones follow the card's position. Data images are bundled in `assets/` under the
`home_` prefix and resolved in `images.ts`. The shell fills the meta bar's end (the Show case
button, shown only while the page has a show).

Domain terms:
- **Hooks**: the `home-*` test ids (`testIds.ts`, ADR-0006 → Decision 2). The Show case's damage
  layers select them, so they are a contract with `src/screens/retro`.
- **Page agent** (ADR-0002): every section and item the chat can point at carries
  `data-agent-id`. Sections `header` (meta bar + header), `skills`, `craft`, `loop`, `impact`, `experience`,
  `education`, `about`, `contacts` (the closing call to action); items `impact:`,
  `experience:` (with Transcenda's tree), `app:` (its projects), `skill:`, `book:`, and
  `contact:<channel>` on the header buttons. Each id appears once (`cvPageTargetIds`, 37). While
  the page is shown it offers scroll, highlight (fades after a few seconds) and open contact
  (after the visitor confirms in the chat).

Stubs and limits:
- `HomeRoute` takes two slots from the shell: `metaBarEnd` (meta bar) and `copyrightEnd` (after the
  footer copyright; the Show case link).
- Type and layout values are theme tokens (`src/theme/tokens.css`, checked against
  `docs/design/v3/design.dc.html` and its 2026-10-05 handoff). Jobs and Transcenda's projects share
  one layout: head, then the tag line and the dot points from the logo's left edge.
- The print / PDF layout (`docs/design/v3/design-print.dc.html`) is not built.
- The "Ask my AI" launcher belongs to the chat screen, not this page.
- Motion (intro on load, section reveals on scroll, hover tilt, the loop's cursor spotlight, scroll
  progress bar, header stat parallax) is in `motion/`, its own `AGENTS.md`; it finds parts by
  `data-motion`. It adds two decorative elements: the progress bar (empty until the motion drives
  it) and the loop panel's spotlight (invisible until the cursor moves in).
