# app

Why it exists: the shell that turns the pieces into the site: the page for the URL with the
Show case button and the language switcher in its meta bar, and the floating AI chat over it. On a
page with a show (`/` and `/new`) it starts the Retro Rebuild show (the page turns into a broken 2002
site and an "agent" fixes it live) when asked, and otherwise shows today's site. It is also the single place where the app decides which data
sources it uses.

Domain terms:
- **Mode:** `show` or `normal` at page load (docs/retro/ARCHITECTURE.md §9 → Round 5): `?retro=1`
  on a page with a show opens with it, anything else is today's site. Nothing starts on its own.
- **Scenario per page** (`showScenarios.ts`, ARCHITECTURE §10): which show a page runs (`/` →
  `retro-3`, `/new` → `retro-new-1`). Adding a page's show is one line here, landing together
  with its source in `src/screens/retro/scenarios.ts`; a page without one gets today's page at
  `?retro=1` and no Show case button.
- **Show case / start seam** (`useShowCase`): `start()` for the Show case button (R24) and
  replays; today's site stays until the show's chunk has loaded, then the page scrolls to the top
  and turns broken in one commit. The AI chat is off the page while the show runs (its open
  conversation is lost) until the show's last step loads it.
- **Stage:** the shell's wrapper (page + chat) carrying `data-retro-stage` while the show runs;
  the show's damage layers select only under it.

Place in the architecture: the top of the tree. `AppProviders` wires i18n, the data bindings
(the CV and profile repositories, today one instance over the bundled JSON; the chat repository,
the real `/api/chat`; the show repository, `/api/chat` `v: 3`) and the page-agent tool registry
(`src/agent/`, given the page so it offers that page's tools). Swapping the CV mock for a backend
is one line there. Tests pass fakes, a fixed `retroMode` and a fixed `page` through its props. The shell also offers the `switchLanguage` tool to the page agent,
since language is an app-level concern.

Both modes render one tree shape, so the page's route never remounts: the show (`RetroShowRoute`, from
`src/screens/retro`) mounts next to the shell and portals its windows into `body`. The AI chat
(`ChatRoute`) is a lazy chunk on both pages and in both modes: normal mode loads it at start; the
show's last step loads it through the `ai-chat` loader, which resolves once the chat is rendered.

The show is a lazy chunk too, requested only when the show is asked for, so other visitors never
download it. At a `?retro=1` load the shell is `visibility: hidden` while it loads; it is revealed
in the commit that mounts the show, whose damage layers go in before the browser paints, so the
first visible frame is already the broken page (no flash of today's design). If the chunk fails
to load (offline, a deploy swapped the chunks) the shell stays on (or falls back to) today's site
and the AI chat loads.

Rules and limits:
- Owner: Scaffold. Screens may only register their own route in `App.tsx`.
- Two pages, no router library: `routes.ts` maps `/new` to the profile screen and every other path
  to the CV; both are Forest pages that lay themselves out; the shell composes their meta bar's end
  (Show case button, language switcher) and the chat is shared. The page id (`cv` / `profile`) is the chat contract's: the shell passes it to the chat,
  which answers about that page and offers its own first questions. Production serves `/new` through the rewrite in `vercel.json`; Vite dev/preview fall
  back to `index.html` by themselves.
- Entry point is `src/main.tsx` (global styles, providers, `App`).
- Reduced motion is read by the show itself. The Show case button (start and replay) shows only
  on a page with a scenario, for English, on ≥ 1024 px (`useShowCaseAvailable`); the start seam
  itself checks only the scenario.
