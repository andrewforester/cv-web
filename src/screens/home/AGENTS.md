# home

Why it exists: the one CV page of the site (design `docs/design/v3/`, ADR-0006): Andrew as a
Senior Software Product Engineer, under a sticky toolbar that lists the page's sections and marks
the one being read (`docs/design/page-nav/`), with the stats and contacts up top, skills (right after the
header: the human's call, CV-145; a test locks the order), selected impact, projects (personal
products), experience (Transcenda's client projects on a tree), code craft × agentic process, how he builds with agents, education, about me and a closing call to action. It replaced both older pages: the
app shell shows it on every path, and `/new` redirects here on Vercel.

Place in the architecture: the screen pattern of the root `AGENTS.md` over `CvPageRepository`
(`src/data`, backed by the canonical CV data `src/data/cv/cvPage.json`, ADR-0007, English only). The state holder loads the page
and owns the page agent's highlight and the toolbar's active section; the stateless screen renders the page's blocks with
components that live in this folder (one screen uses them). All content about Andrew is data;
section headings, the toolbar's labels and fixed words (the handle, "Email me", ©) are this
screen's strings. The look
is not data: card tones follow the card's position. Data images are bundled in `assets/` under the
`home_` prefix and resolved in `images.ts`. The shell fills the meta bar's end (the Show case
button, hidden for now, CV-144) and the footer copyright's end (`copyrightEnd`: the Show case link,
shown only while the page has a show).

Domain terms:
- **Hooks**: the `home-*` test ids (`testIds.ts`, ADR-0006 → Decision 2). The Show case's damage
  layers select them, so they are a contract with `src/screens/retro`.
- **Page top**: wider than 1100 px the meta bar sits at the header's top right, level with the
  photo (`HomeTop`); narrower it is above the header.
- **Toolbar**: the handle and the nav sections (`homeNav.ts`, the page's agent sections minus
  the header, in page order); at 960 px and narrower they fold into a menu opened from the bar,
  which then names the section being read. The active one is the section on the reading line shared with the
  chat (`sectionInView`), the last one at the page end, none on the header; a click scrolls like
  the agent does, and `--agent-scroll-margin-top` keeps headings below the toolbar.
- **Page agent** (ADR-0002): every section and item the chat can point at carries
  `data-agent-id`. Sections `header` (meta bar + header), `skills`, `impact`, `projects`, `experience`, `craft`, `loop`,
  `education`, `about`, `contacts` (the closing call to action); items `impact:`,
  `experience:` (projects and jobs; with Transcenda's tree), `app:` (its projects), `skill:`, `book:`, and
  `contact:<channel>` on the header buttons. Each id appears once (`cvPageTargetIds`, 41). While
  the page is shown it offers scroll, highlight (fades after a few seconds) and open contact
  (after the visitor confirms in the chat).

Stubs and limits:
- `HomeRoute` takes two slots from the shell: `metaBarEnd` (meta bar) and `copyrightEnd` (after the
  footer copyright; the Show case link).
- Type and layout values are theme tokens (`src/theme/tokens.css`, checked against
  `docs/design/v3/design.dc.html` and its 2026-10-05 handoff). Jobs and Transcenda's projects share
  one layout: head, then the tag line and the dot points from the logo's left edge.
- The print / PDF layout (`docs/design/v3/design-print.dc.html`) is not built.
- The "Talk to my AI" launcher belongs to the chat screen, not this page.
