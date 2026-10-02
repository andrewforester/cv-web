# profile

Why it exists: the redesigned CV page at `/new` (design `docs/design/forest/`, the "Forest"
look): Andrew as an AI Product Engineer, with selected impact, how he builds with agents,
experience, apps, skills, education and about me. It is built next to the current CV (`/`) so the
new content and look can ship without touching the live page.

Place in the architecture: the `cv` screen pattern over the profile repository (`src/data`,
`ProfileRepository`, mocked by `src/data/mock/profile.*.json`): the state holder loads the profile
for the current language, the stateless screen renders it. All content comes from data, already
translated (EN + UK); only section labels and fixed UI words are strings. The app shell shows this
screen for `/new` (`src/app/routes.ts`).

Stubs and limits:
- Placeholder: only the name, headline and subtitle render, unstyled. The Forest sections and
  components (`src/shared/forest/`) come in the next task; `strings.ts` already holds the section
  labels for it.
- No page-agent tools yet and no link between `/` and `/new`.
