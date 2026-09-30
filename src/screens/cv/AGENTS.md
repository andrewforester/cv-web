# cv

Why it exists: the product itself: Andrew Panasiuk's CV as one scrolling page, the site's root.
A recruiter or client sees who he is and how to reach him (header with photo and contact links),
a summary, his technologies (with AI tools highlighted), latest and previous experience, the apps
he built with their store ratings, education, favourite books and interests. Design:
`docs/design/cv/SPEC.md`. It works from a phone to a desktop.

Place in the architecture: the screen pattern over the CV repository (`src/data`): the state
holder loads the CV for the current language, the stateless screen renders the sections in SPEC
order. All content comes from data; only UI labels are strings (English only for now, Ukrainian
falls back). Images are resolved from data references to bundled assets.

Page agent: every section and item is a target the AI chat can point at. The screen offers the
agent three tools while the CV is shown: scroll to a section, highlight an item (it fades after a
few seconds), and open a contact (after the visitor confirms in the chat). Targets are addressed
by the CV item ids, so the same command works in every language.

Stubs and limits:
- Image sizes and two emphasis weights are screen-local custom properties marked `TODO(theme)`.
- Scrolling to a section doesn't update the URL hash.
