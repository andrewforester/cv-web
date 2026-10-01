# theme

Why it exists: the site's visual language in one place, so every screen looks like the Figma
reference (`docs/COORDINATION.md` → Design source of truth) and a style change is a token change,
not a hunt through components. Tokens come from `docs/design/cv/SPEC.md`: colours, the AI
gradient, shadows, radii, the type scale per role, the spacing scale, content width and gutters,
and the page-agent highlight.

Place in the architecture: global CSS custom properties, fonts and base styles, imported once by
`src/main.tsx`; every CSS Module reads `var(--token)`. No TypeScript mirror: add one only when code
needs a value.

Rules and limits:
- Owner: Theme. A screen that needs a value adds a token here (through the Theme task), not a
  literal; screen-local values are marked `TODO(theme)`.
- The `--retro-*` block ("Retro Rebuild show panels", from `docs/design/retro/SPEC.md`) styles only
  the terminal chat and console windows of the live-fix show (Win98 face, bevel light/inner
  light/shadow/dark, window shadow, terminal and code colours) and the round-3 motion: highlight look,
  page frame, fade/morph/leave/close/reserve timings and the close easing; damage values live in the screen's layers.
  Round 4 adds the box-model highlight fills, the close slide/shrink timings and the `--devtools-*`
  group (the DevTools panel's Chrome-light surfaces, text, badge and syntax colours, fonts, plate shadow).
  The Win98/terminal tokens stay until R16/R17 stop reading them, then they are removed.
- Fonts are self-hosted Inter, Latin and Cyrillic only, a fixed set of weights; Cyrillic files
  load only when Cyrillic text is on the page.
