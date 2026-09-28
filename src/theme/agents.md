# theme

Design tokens and global styles for the whole site.

- `tokens.css`: CSS custom properties (`--color-*`, `--font-*`, `--space-*`, `--radius-*`,
  `--content-max-width`). The only place for colours, text sizes, spacing and radii; components use
  `var(--token)` in their CSS Modules, never literals.
- `global.css`: imports the tokens, box-sizing reset, base font/colour on `html`. Imported once in
  `src/main.tsx`.

Owner: Theme Issue (label `theme`). Values are neutral placeholders; the real style comes from the
Figma file named in `docs/COORDINATION.md` → Design source of truth. No TS mirror of the tokens
exists yet; add one only when code (not CSS) needs a token value.
