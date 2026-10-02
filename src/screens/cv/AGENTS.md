# cv

Why it exists: the product itself: Andrew Panasiuk's CV as one scrolling page, the site's root
(`/`). A recruiter or client sees who he is and how to reach him (hero with photo, summary,
contacts), his skills (AI tools set apart), his experience with the apps he built and their store
stats, education, favourite books and interests, and a closing "let's build" mail link. Look:
the Forest design (`docs/design/forest/SPEC.md` → "Mapping `/`"); the content is today's CV. It
works from a phone to a desktop.

Place in the architecture: the screen pattern over the CV repository (`src/data`): the state
holder loads the CV for the current language, the stateless screen maps it onto the shared Forest
components (`src/shared/forest/`) and numbers the sections in page order. All content comes from
data (English only today; Ukrainian falls back to it); section labels and fixed words are strings
(EN + UK). Data images (photo, app icons, book covers) are resolved from data references to
bundled assets. The app shell passes the language switcher into the meta bar.

Page agent: every section and item is a target the AI chat can point at (`data-agent-id`, passed
to the Forest components as `data-*` attributes). The screen offers the agent three tools while
the CV is shown: scroll to a section, highlight an item (it fades after a few seconds), and open a
contact (after the visitor confirms in the chat). Targets are addressed by the CV item ids, so the
same command works in every language. Latest experience, previous experience and the apps are
separate agent sections inside the one "Experience" section.

Stubs and limits:
- The emphasis weight (600) is a screen-local custom property marked `TODO(theme)`.
- Company logos (`ExperienceEntry.logo`), the technology cards' `column` and the book authors'
  captions aren't shown (SPEC Decision 5); authors stay in the cover's alt text.
- The agent highlight colour is the previous look's navy (`--agent-highlight-color`, theme).
- Scrolling to a section doesn't update the URL hash.
