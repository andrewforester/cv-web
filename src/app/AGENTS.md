# app

Why it exists: the shell that turns the pieces into the site: the one CV page (`src/screens/home`,
on every path) with the Show case button at the end of its meta bar, and the floating AI chat over
it. When the page has a show it starts the Retro Rebuild show (the page turns into a broken 2002
site and an "agent" fixes it live) when asked, and otherwise shows today's site. It is also the
single place where the app decides which data sources it uses.

Domain terms:
- **Mode:** `show` or `normal` at page load (docs/retro/ARCHITECTURE.md §9 → Round 5): `?retro=1`
  on a page with a show opens with it, anything else is today's site. Nothing starts on its own.
- **Scenario** (`showScenarios.ts`, ARCHITECTURE §11): the show the page runs. It is `undefined`
  (no show) until `retro-4` is ported to the v3 page (CV-107 Build split → T6); meanwhile
  `?retro=1` opens today's page and there is no Show case button.
- **Show case / start seam** (`useShowCase`): `start()` for the Show case button (R24) and
  replays; today's site stays until the show's chunk has loaded, then the page scrolls to the top
  and turns broken in one commit. The AI chat is off the page while the show runs (its open
  conversation is lost) until the show's last step loads it.
- **Stage:** the shell's wrapper (page + chat) carrying `data-retro-stage` while the show runs;
  the show's damage layers select only under it.

Place in the architecture: the top of the tree. `AppProviders` wires i18n, the data bindings
(the CV page, CV and profile repositories, today one instance over the bundled JSON; the chat
repository, the real `/api/chat`; the show repository, `/api/chat` `v: 3`) and the page-agent tool
registry (`src/agent/`). Swapping the mock for a backend is one line there. Tests pass fakes, a
fixed `retroMode` and a fixed `page` through its props.

Both modes render one tree shape, so the page never remounts: the show (`RetroShowRoute`, from
`src/screens/retro`) mounts next to the shell and portals its windows into `body`. The AI chat
(`ChatRoute`) and the show are lazy chunks: normal mode loads the chat at start; the show is
requested only when asked for, so other visitors never download it. At a `?retro=1` load the shell
is `visibility: hidden` while the show loads and is revealed in the commit that mounts it, so the
first visible frame is already the broken page. If the chunk fails to load the shell stays on (or
falls back to) today's site and the AI chat loads.

Rules and limits:
- Owner: Scaffold. Screens may only register their own route in `App.tsx`.
- One page, no router: `/new` is a 307 redirect to `/` in `vercel.json`; Vite dev/preview serve
  the same app for any path. Until the chat moves to v4 (CV-111) the shell still passes the chat
  a v2 page id from the URL (`routes.ts`), so the chat's catalogue and suggestions are the old
  pages' while the one page is on screen.
- Entry point is `src/main.tsx` (global styles, providers, `App`).
- Reduced motion is read by the show itself. The Show case button (start and replay) shows only
  while the page has a scenario, on ≥ 1024 px (`useShowCaseAvailable`); the start seam itself
  checks only the scenario.
