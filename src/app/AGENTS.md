# app

Why it exists: the shell that turns the pieces into the site: the one CV page (ADR-0006) on every
path, with the Show case button at the end of its meta bar, and the floating AI chat over it. When
the page has a show it starts the Retro Rebuild show (the page turns into a broken 2002 site and
an "agent" fixes it live) when asked, and otherwise shows today's site. It is also the single
place where the app decides which data sources it uses.

Domain terms:
- **Mode:** `show` or `normal` at page load (docs/retro/ARCHITECTURE.md §9 → Round 5): `?retro=1`
  on a page with a show opens with it, anything else is today's site. Nothing starts on its own.
- **Scenario** (`showScenarios.ts`, ARCHITECTURE §11): the show the page runs, `retro-4`;
  `undefined` would turn it off (no Show case button, `?retro=1` opens today's page).
- **Show case / start seam** (`useShowCase`): `start()` for the Show case button and replays;
  today's site stays until the show's chunk has loaded, then the page scrolls to the top and turns
  broken in one commit. The AI chat is off the page while the show runs (its open conversation is
  lost) until the show's last step loads it.
- **Stage:** the shell's wrapper (page + chat) carrying `data-retro-stage` while the show runs;
  the show's damage layers select only under it.

Place in the architecture: the top of the tree. `AppProviders` wires the data bindings
(one static repository over the bundled JSON for the page; the chat repository, the real
`/api/chat` `v: 4`; the show repository, `/api/chat` `v: 3`) and the page-agent tool registry
(`src/agent/`, whose one catalogue comes from `CvPage`). Swapping the mock for a backend is one
line there. Tests pass fakes and a fixed `retroMode` through its props.

Both modes render one tree shape, so the page never remounts: the show (`RetroShowRoute`, from
`src/screens/retro`) mounts next to the shell and portals its windows into `body`. The AI chat
(`ChatRoute`) is a lazy chunk in both modes: normal mode loads it at start; the show's last step
loads it through the `ai-chat` loader, which resolves once the chat is rendered. The show is a
lazy chunk too, requested only when asked for; at a `?retro=1` load the shell is hidden until it
has loaded, so the first visible frame is already the broken page. If a chunk fails to load the
shell stays on today's site.

Rules and limits:
- Owner: Scaffold. Screens may only register their own route in `App.tsx`.
- One page, no router: every path renders `HomeRoute`; production redirects `/new` to `/`
  (`vercel.json`), Vite dev/preview fall back to `index.html` by themselves.
- Entry point is `src/main.tsx` (global styles, providers, `App`).
- Reduced motion is read by the show itself. The Show case button shows only with a scenario, on
  ≥ 1024 px (`useShowCaseAvailable`); the start seam itself checks only the scenario.
