# app

Why it exists: the shell that turns the pieces into the site: the one CV page (ADR-0006) on every
path, with the Show case link after the footer copyright, and the floating AI chat over it. When
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
- **Voice mode** (`voiceMode.ts`, docs/voice/SYSTEM_DESIGN.md §9): `off`, `real`, `fake` or `demo`
  at page load. `?voice=1` turns the mic button on and remembers it in `localStorage` (`cv.voice`),
  `?voice=0` forgets it, `?voice=fake` uses the scripted client for that load only (dev server and `npm run build:e2e`;
  `off` in a production build), `?voice=demo` the endless demo call of `npm run demo` (dev server only). Off by default;
  not a security layer (the server's `VOICE_ENABLED` is).
- **Stage:** the shell's wrapper (page + chat) carrying `data-retro-stage` while the show runs;
  the show's damage layers select only under it.

Place in the architecture: the top of the tree. `AppProviders` wires the data bindings
(one static repository over the bundled JSON for the page; the chat repository, the real
`/api/chat` `v: 4`; the show repository, `/api/chat` `v: 3`; the voice session repository,
`/api/voice-session`, and the voice client the flag picks, `null` = no mic button) and the
page-agent tool registry
(`src/agent/`, whose one catalogue comes from `CvPage`). Swapping the mock for a backend is one
line there. Tests pass fakes, a fixed `retroMode` and a `voiceClient` through its props.

Both modes render one tree shape, so the page never remounts: the show (`RetroShowRoute`, from
`src/screens/retro`) mounts next to the shell and portals its windows into `body`. The AI chat
(`ChatRoute`) is a lazy chunk in both modes: normal mode loads it at start; the show's last step
loads it through the `ai-chat` loader, which resolves once the chat is rendered. The show is a
lazy chunk too, requested only when asked for; at a `?retro=1` load the shell is hidden until it
has loaded, so the first visible frame is already the broken page. If a chunk fails to load the
shell stays on today's site.

- **Dock** (docs/voice/SYSTEM_DESIGN.md §4.3): the space the chat asks the shell to keep free
  (`none`, `side` beside the floating panel, `bottom` sheet), reported through `onDockChange`. The
  shell mirrors it as `data-chat-dock` on `<html>` before paint (`none` while the chat is off the
  page); `App.module.css` turns it into room: at `side` the whole page slides left by half the dock
  (`transform` on `main`, ADR-0011 → Decision 1), so the CV card keeps its width and nothing
  reflows; the slide is timed with the panel's morph (`--chat-slide-*`; reduced motion: at once).
  The `bottom` sheet's space is padding on `main` (`--voice-sheet-height`) and appears at once. The
  slide changes no box, so the scroll position never drifts (no anchor hook).

Rules and limits:
- Owner: Scaffold. Screens may only register their own route in `App.tsx`.
- One page, no router: every path renders `HomeRoute`; production redirects `/new` to `/`
  (`vercel.json`), Vite dev/preview fall back to `index.html` by themselves.
- Entry point is `src/main.tsx` (global styles, providers, `App`).
- Nothing inside `main` is `position: fixed` or `sticky`: the slid `main` is their containing
  block. Overlays (the chat, its launcher and call pill, the show) are siblings of `main`.
- The show starts from the footer Show case link (`ShowCaseLink`, CV-148; `useShowCaseAvailable`:
  a scenario and ≥ 1024 px) and with `?retro=1`.
- The Show case button is hidden (`SHOW_CASE_BUTTON_ENABLED = false` in `App.tsx`, CV-144); the footer link
  is not gated by it. Set the constant to `true` to bring the button back.
- Reduced motion is read by the show itself and, for the dock, by `App.module.css`. The Show case button shows only with a scenario, on
  ≥ 1024 px (`useShowCaseAvailable`); the start seam itself checks only the scenario.
- Real-user speed: `AppSpeedInsights` sends Core Web Vitals to Vercel Speed Insights (dashboard:
  project `cv-web` → Speed Insights). Every view counts as route `/` (no `?retro=1` noise); it runs
  only on the deployed site, not in dev or local preview. Same-origin `/_vercel/speed-insights/*`,
  so the CSP in `vercel.json` needs no change.
