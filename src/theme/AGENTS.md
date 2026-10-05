# theme

Why it exists: the site's visual language in one place, so every screen looks like the design
reference (`docs/COORDINATION.md` → Design source of truth) and a style change is a token change,
not a hunt through components. Tokens come from `docs/design/forest/SPEC.md` (below), plus the
spacing scale, the body text, the chat's sizes and the page-agent highlight. Of the previous look
(`docs/design/cv/SPEC.md`) only `--color-text-secondary` is left: the highlight colour points at
it until the Theme moves it to a Forest colour.

Place in the architecture: global CSS custom properties, fonts and base styles, imported once by
`src/main.tsx`; every CSS Module reads `var(--token)`. No TypeScript mirror: add one only when code
needs a value.

Rules and limits:
- Owner: Theme. A screen that needs a value adds a token here (through the Theme task), not a
  literal.
- The `--retro-*` block ("Retro Rebuild show panels", from `docs/design/retro/SPEC.md`) styles only
  the terminal chat and console windows of the live-fix show (Win98 face, bevel light/inner
  light/shadow/dark, window shadow, terminal and code colours) and the round-3 motion: highlight look,
  page frame, fade/morph/leave/close/reserve timings and the close easing; damage values live in the screen's layers.
  Round 4 adds the box-model highlight fills, the close slide/shrink timings and the `--devtools-*`
  group (the DevTools panel's Chrome-light surfaces, text, badge and syntax colours, fonts, plate shadow).
  The Win98/terminal tokens stay until R16/R17 stop reading them, then they are removed.
- Fonts are self-hosted, a fixed set of weights; Cyrillic files load only
  when Cyrillic text is on the page: Onest (display, the body default), IBM Plex Sans (text) and
  JetBrains Mono (meta). Inter is no longer imported (its npm package is still installed).

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

v3 tokens (`docs/design/v3/SPEC.md`, ADR-0006 Decision 5; look-neutral role names, added next to the
Forest ones, which go in Cleanup; the page screen uses them from T3):
- Colours `--color-{page,card,ink,ink-2,ink-3,ink-4,accent,accent-hover,accent-pink,on-accent,surface,
  surface-pink,surface-lilac,surface-violet,line,tree-line,status,status-dot,dark-ink,dark-line,
  dark-number,dark-note}`; gradients `--gradient-{brand,brand-tile,dark,footer}`; shadows
  `--shadow-{card,dark,cta,launcher}`.
- Fonts `--font-sans` (Figtree 400-700, latin only) and `--font-mono`; type
  `--type-<role>-{size,weight,line-height,letter-spacing}` for `h1`, `h2`, `name`, `tagline`,
  `summary`, `stat`, `card-title`, `body`, `label`, `meta`, `tag`, `company`, `role`, `period`,
  `impact`, `loop-lead`, `footer-title`, `button`; radii `--radius-{page,card,tile,pill,logo,book}`;
  layout `--page-{max-width,padding-x,section-gap}`.
- Chat look (T5): the chat uses the v3 tokens (panel = the loop panel's `--gradient-dark` and
  `--color-dark-*`); its own `--chat-*` block next to them holds only what v3 has no value for
  (muted ink on dark, fills, error/notice, panel shadow, chat type sizes, the launcher's padding).
  `--forest-chat-*` and `--chat-fab-*` are no longer read by the chat; they go in Cleanup once the show stops reading them.
- `--agent-highlight-color` is `--color-accent`. The site is English only, so no Cyrillic is added.
