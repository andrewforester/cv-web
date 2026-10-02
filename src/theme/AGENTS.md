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
- Fonts are self-hosted, Latin and Cyrillic only, a fixed set of weights; Cyrillic files load only
  when Cyrillic text is on the page. Inter is the current site's font; Forest adds Onest (display),
  IBM Plex Sans (text) and JetBrains Mono (meta). Inter goes when the last screen leaves it.

Forest tokens (`docs/design/forest/SPEC.md`; the names are the contract for screen and chat tasks,
all in `tokens.css`; the AI chat uses them, plus its own `--forest-chat-*` from
`docs/design/forest-chat/SPEC.md`: raised fills, error / notice colours, shadows, text sizes):
- Colours: `--forest-{bg,ink,ink-2,ink-3,accent,accent-hover,green,gold,gold-soft,status,status-dot,
  line,surface,card-sage,card-sand,dark-ink,dark-ink-2,dark-line}`; gradients
  `--forest-gradient-{text,cta,hero,dark}`; shadow `--forest-shadow-dark`.
- Radii: `--forest-radius-{impact,panel,step,pill,book}` (50% is written inline).
- Layout: `--forest-content-max`, `--forest-page-padding-{top,x,bottom}`, `--forest-section-gap`.
- Fonts: `--forest-font-{display,text,mono}`.
- Type: `--forest-type-<role>-{family,size,weight,line-height,letter-spacing}` for roles `h1`,
  `subtitle`, `name`, `lead`, `label`, `impact`, `card`, `dark-lead`, `title` (company / card title),
  `role` (role, meta), `period`, `body` (bullet / body), `skills-title`, `skills-items`, `meta-bar`,
  `cta`. Stepped sizes switch to the phone value in one `@media (max-width: 600px)`; `text-wrap`
  stays in the component.
