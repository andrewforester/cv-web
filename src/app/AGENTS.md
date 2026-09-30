# app

Why it exists: the shell that turns the pieces into one page: the header with the language
switcher, the CV, and the floating AI chat over it. It decides, once per page load, whether the
visitor first gets the Retro Rebuild show (the CV opens as a broken 2002 site and an "agent" fixes
it live) or today's site. It is also the single place where the app decides which data sources
it uses.

Domain terms:
- **Mode:** `show` or `normal` (docs/retro/ARCHITECTURE.md §6). `?retro=1` forces the show,
  `?retro=0` skips it; otherwise English desktop visitors (`min-width: 1024px`) get it once per
  browser session (`sessionStorage['retro.done']`, written when the show ends).
- **Stage:** the shell carrying `data-retro-stage` while the show runs; the show's damage layers
  select only under it. The header keeps `data-testid="app-header"` so a layer can hide it.

Place in the architecture: the top of the tree. `AppProviders` wires i18n, the data bindings
(the CV repository, today the bundled JSON; the chat repository, the real `/api/chat`; the show
repository, `/api/chat` `v: 3`) and the page-agent tool registry (`src/agent/`). Swapping the CV
mock for a backend is one line there. Tests pass fakes and a fixed `retroMode` through its props;
without the seam jsdom has no `matchMedia`, so tests get the normal site. The shell also offers
the `switchLanguage` tool to the page agent, since language is an app-level concern.

Both modes render one tree shape, so `CvRoute` never remounts: the show (`RetroShowRoute`, from
`src/screens/retro`) mounts next to the shell and portals its windows into `body`. The AI chat
(`ChatRoute`) is a lazy chunk in both modes: normal mode loads it at start; the show's last step
loads it through the `ai-chat` loader, which resolves once the chat is rendered.

Rules and limits:
- Owner: Scaffold. Screens may only register their own route in `App.tsx`.
- One page, no router yet: add one when a second page appears.
- Entry point is `src/main.tsx` (global styles, providers, `App`).
- Reduced motion is read by the show itself; no replay button, no show on mobile or in Ukrainian
  (out of scope for now).
