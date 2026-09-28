# theme

Design tokens, fonts and global styles for the whole site.

- `tokens.css`: CSS custom properties from `docs/design/cv/SPEC.md` (Tokens, Scale), exact names:
  `--color-*`, `--gradient-ai`, `--shadow-*`, `--radius-*`, `--border-card`, `--font-<name>-size|line-height|weight`
  (name, section, subsection, body, education, card-title, card-body, meta, tag, book-title,
  book-author, app-name, app-publisher, app-value, app-label), `--font-family`,
  `--letter-spacing`, `--letter-spacing-app`, `--space-1..9` (4, 8, 12, 16, 20, 24, 30, 36, 48 px),
  `--content-max-width`, `--page-gutter`. Components use `var(--token)` in CSS Modules, never
  literals. Add a token rather than repeating a literal.
- `fonts.css`: self-hosted Inter via `@fontsource/inter`: latin + cyrillic subsets only, weights
  400/500/600/700 + italic 400/700, `font-display: swap`. Cyrillic files load only when Cyrillic
  glyphs are rendered (`unicode-range`). No variable/all-weights bundle.
- `global.css`: imports fonts and tokens, box-sizing reset, body typography (Inter, body scale,
  colours, letter-spacing). Imported once in `src/main.tsx`.

Owner: Theme Issue (label `theme`). No TS mirror of the tokens; add one only when code needs a value.
