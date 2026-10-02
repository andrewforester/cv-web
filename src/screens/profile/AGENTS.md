# profile

Why it exists: the redesigned CV page at `/new` (design `docs/design/forest/`, the "Forest"
look): Andrew as an AI Product Engineer, with selected impact, how he builds with agents,
experience, apps, skills, education and about me. It is built next to the current CV (`/`) so the
new content and look can ship without touching the live page.

Place in the architecture: the `cv` screen pattern over the profile repository (`src/data`,
`ProfileRepository`, mocked by `src/data/mock/profile.*.json`): the state holder loads the profile
for the current language, the stateless screen composes the Forest components
(`src/shared/forest/`) from it, section by section, and numbers the sections. All content comes
from data, already translated (EN + UK); only section labels and fixed UI words (meta-bar handle,
"Earlier", the footer ©) are strings. Data images (photo, app icons, book covers) are bundled in
`assets/` under the `profile_` prefix. The app shell shows this screen for `/new`
(`src/app/routes.ts`) and passes the language switcher into the meta bar.

Stubs and limits:
- "Live AI CV — ask it anything" links to `#ask`; the chat opens on that hash.
- No page-agent tools: the tool catalogue (`src/data/chat/agentTools.ts`) is built from `Cv`
  with CV section ids, so `/new`'s sections aren't valid targets yet.
- No link between `/` and `/new` (SPEC Decision 4).
