# app

Why it exists: the shell that turns the pieces into one page: the header with the language
switcher, the CV, and the floating AI chat over it. It is also the single place where the app
decides which data sources it uses.

Place in the architecture: the top of the tree. `AppProviders` wires i18n, the data bindings
(the CV repository, today the bundled JSON; the chat repository, the real `/api/chat`) and the
page-agent tool registry (`src/agent/`). Swapping the CV mock for a backend is one line there.
Tests pass fakes through its props. The shell itself also offers the `switchLanguage` tool to the
page agent, since language is an app-level concern.

Rules and limits:
- Owner: Scaffold. Screens may only register their own route in `App.tsx`.
- One page, no router yet: add one when a second page appears.
- Entry point is `src/main.tsx` (global styles, providers, `App`).
