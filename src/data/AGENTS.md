# data

Why it exists: everything the site knows about Andrew's CV and where it comes from. The CV is
content, not UI text: it arrives already localized and structured (header and contacts, summary,
technologies, experience, apps, education, books, interests), exactly the sections of
`docs/design/cv/SPEC.md`. The `/new` page has its own model, `Profile` (`profile.ts`: meta bar,
hero, impact, the agentic loop, jobs, apps, skills, education, about, footer CTA), the sections
of `docs/design/forest/SPEC.md`, behind its own `ProfileRepository`.

Place in the architecture: the bottom layer. Screens reach it only through their state holders,
via repository interfaces provided in `src/app/AppProviders.tsx`. The CV repository is async on
purpose so the planned CV-editing backend can replace today's bundled JSON (`mock/`) by adding an
HTTP implementation and swapping one binding. `chat/` is the data layer of the AI chat and owns
the `/api/chat` contract shared with `server/`.

Domain rules:
- Rich text is typed spans with emphasis, never HTML. Images are references (a bundled asset id
  resolved by the screen, or a URL).
- Technology cards, experience entries, apps and books (and every `Profile` list item) carry a
  stable slug `id`, the same in every locale: the AI page agent addresses page items by it.
- `models.ts` and `profile.ts` may be imported by the server, so they stay framework-free.
