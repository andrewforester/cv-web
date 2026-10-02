# app

Why it exists: the shell that turns the pieces into the site: the header with the language
switcher, the page for the URL, and the floating AI chat over it. It is also the single place where the app
decides which data sources it uses.

Place in the architecture: the top of the tree. `AppProviders` wires i18n, the data bindings
(the CV and profile repositories, today one instance over the bundled JSON; the chat repository, the real `/api/chat`) and the
page-agent tool registry (`src/agent/`). Swapping the CV mock for a backend is one line there.
Tests pass fakes through its props. The shell itself also offers the `switchLanguage` tool to the
page agent, since language is an app-level concern.

Rules and limits:
- Owner: Scaffold. Screens may only register their own route in `App.tsx`.
- Two pages, no router library: `routes.ts` maps `/new` to the profile screen and every other path
  to the CV; header, language switcher and chat are shared. Production serves `/new` through the
  rewrite in `vercel.json`; Vite dev/preview fall back to `index.html` by themselves.
- Entry point is `src/main.tsx` (global styles, providers, `App`).
