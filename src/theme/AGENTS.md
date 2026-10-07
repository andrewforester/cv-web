# theme

Why it exists: the site's visual language in one place, so every screen looks like the design
reference (root `AGENTS.md` → Design: `docs/design/v3/`) and a style change
is a token change, not a hunt through components.

Place in the architecture: global CSS custom properties, fonts and base styles, imported once by
`src/main.tsx`; every CSS Module reads `var(--token)`. No TypeScript mirror: add one only when code
needs a value.

Rules and limits:
- Owner: Theme. A screen that needs a value adds a token here (through the Theme task), not a
  literal.
- Fonts are self-hosted, latin only, a fixed set of weights: Figtree 400–700 (everything) and
  JetBrains Mono 400/500 (labels, meta). The site is English only, so no Cyrillic.

Tokens (`docs/design/v3/SPEC.md`, ADR-0006 Decision 5; look-neutral role names):
- Colours `--color-{page,card,ink,ink-2,ink-3,ink-4,accent,accent-hover,accent-pink,on-accent,surface,
  surface-pink,surface-lilac,surface-violet,line,tree-line,status,status-dot,dark-ink,dark-line,
  dark-number,dark-note}`; gradients `--gradient-{brand,brand-tile,dark,footer}`; shadows
  `--shadow-{card,dark,cta,launcher}`.
- Fonts `--font-sans`, `--font-mono`; type `--type-<role>-{size,weight,line-height,letter-spacing}`
  for `h1`, `h2`, `name`, `tagline`, `summary`, `stat`, `card-title`, `body`, `label`, `meta`,
  `tag`, `company`, `role`, `period`, `impact`, `loop-lead`, `footer-title`, `button`, plus
  `--type-{about,initials,star,medium-weight}` and `--type-impact-text-line-height`. Values are
  those of `design.dc.html`; line-height is `normal` where the design sets none, because the body's
  1.55 would otherwise leak in. Radii `--radius-{page,card,tile,pill,logo,book}`.
- Layout of the page: `--page-*` (margin, padding, gaps, max widths), `--card-padding`,
  `--panel-padding`, `--cta-*`, sizes (`--photo-size`, `--logo-size`, `--button-height`, ...),
  `--border-{rule,dark-rule}`, the experience tree `--tree-*`, `--focus-ring` and
  `--focus-ring-offset` (the page's links and buttons, the Show case pill). The `--space-*` scale
  has half steps (`1-5`, `2-5`, `3-5`, `5-5`) for the design's 6/10/14/22 px, and `--border-card`.
- Chat: sizes and motion from `docs/design/chat/SPEC.md` (`--chat-*` controls, panel, motion), and
  the look on the v3 palette (panel = the loop panel's `--gradient-dark` and `--color-dark-*`); its
  own `--chat-*` colours hold only what v3 has no value for (muted ink on dark, fills,
  error/notice, panel shadow, chat type sizes, the launcher's padding). The show's agent chat
  (`src/screens/retro/`) reads the same tokens.
- Page agent: `--agent-highlight-*` (colour = `--color-accent`) and the scroll landing margin.
- The show (`docs/design/retro/SPEC.md`): `--retro-*` (dock, highlight fills, motion timings) and
  `--devtools-*` (the DevTools panel's Chrome-light surfaces, text, badge and syntax colours,
  fonts, plate shadow); damage values live in the screen's layers.
- Voice mode (`docs/design/voice/SPEC.md`, ADR-0008): `--color-brand-{pink,violet}` (the brand
  gradient's stops) and `--voice-*` (orb, veil, fog, sizes, motion durations, z-index).
