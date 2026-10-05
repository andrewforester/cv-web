# ADR-0006: One page v3, English only

**Status:** Proposed (CV-107)
**Date:** 2026-10-05
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [`docs/design/v3/SPEC.md`](../design/v3/SPEC.md) (the page),
[`docs/chat/API.md`](../chat/API.md) → v4, [`docs/chat/AGENT.md`](../chat/AGENT.md) §12,
[`docs/retro/ARCHITECTURE.md`](../retro/ARCHITECTURE.md) §11. Supersedes
[ADR-0004](0004-page-aware-chat.md) (page-aware chat) and [ADR-0005](0005-per-page-show.md)
(the show per page); keeps [ADR-0001](0001-ai-cv-chat.md), [ADR-0002](0002-page-agent-tools.md),
[ADR-0003](0003-retro-live-fix-show.md).

## Context

The site has two versions. `/` is `CvRoute` over `Cv` (`src/data/models.ts`, `cv.en.json`, English
only). `/new` is `ProfileRoute` over `Profile` (`profile.{en,uk}.json`). Both are built from the
Forest components (`src/shared/forest/`). The chat knows which page it is on (ADR-0004: page id
`cv | profile`, knowledge, tools and suggestions per page). The Show case has one scenario per page
(ADR-0005: `retro-3` on `/`, `retro-new-1` on `/new`).

Project *One CV page v3* turns this into **one page** with the v3 design and texts
(`docs/design/v3/`). The human also made the site **English only** (CV-107, 2026-10-05). That
overrides SPEC decisions 2 (UK translation) and 3 (Cyrillic font) and the switcher part of
decision 7. Out of scope: a section menu, a print version, content beyond the design.

These constraints still apply:
- ADR-0001/0002: the function is stateless, the cached prefix is byte-stable, and no test calls a
  real model.
- The *lint* boundaries.
- Zones that don't overlap (`docs/COORDINATION.md` → Hot spots).
- `main` stays deployable after every merge.

## Decision 1: A new `CvPage` model; the old models go in Cleanup

One model describes the page. It lives in `src/data/cvPage.ts` and is read through a new
`CvPageRepository.getCvPage(): Promise<CvPage>`, which takes no locale. `StaticCvRepository`
implements it over one file, `src/data/mock/cvPage.json`, bound in `AppProviders` next to the
existing bindings.

| Option | Assessment |
|---|---|
| **A. New model and repository next to the old ones; old ones deleted in Cleanup (chosen)** | Expand, then contract. Every task in between compiles and ships: the old pages, the v2 chat and both shows keep their data until nothing reads them. The model can follow the design exactly (stats, craft cards, projects, logos). |
| B. Evolve `Profile` in place | Fewest types in the end. But the profile screen, its knowledge, catalogue, show and tests all break in the same PR. The page, chat and show would have to land together as one large task. |
| C. Evolve `Cv` (`/`'s model) | Its shape (technology cards, rich text, latest/previous experience) is the furthest from v3. It has the same all-at-once problem as B. |

Shape (TypeScript in the Data task; field names are the contract):

```ts
export interface CvPage {
  meta: CvPageMeta;           // { location, workMode, status } for the meta bar
  name: string;
  tagline: string;            // "Android since 2012 · Agentic engineering"
  photo: ImageRef;
  headline: HeadlinePart[];   // `accent` part = "Product" in the gradient
  summary: string[];          // one entry per line (the design's <br>s)
  stats: Stat[];              // { id, value, label, accent? } ×4; accent = the gradient tile
  contacts: CvContact[];      // { id, label, href }: email, whatsapp, telegram, linkedin
  craft: CraftCard[];         // { id, label, title, text } ×2
  loop: AgentLoop;            // { lead, steps: LoopStep[], footnote }, as Profile
  impact: ImpactCard[];       // { id, value, text } ×3, as Profile
  jobs: CvJob[];              // ×9, design order
  skills: SkillGroup[];       // { id, title, items } ×6, as Profile
  education: Education;       // { title, place, period, text }, as Profile
  about: CvAbout;             // { books: Book[]; lines: { label, text }[] }
  footer: FooterCta;          // { label: "Let's build something", href: mailto }
}
export interface CvJob {
  id: string; company: string; role: string; period: string;
  logo: ImageRef; logoPlain?: boolean;   // Samsung: the logo without a tile
  tag?: string; about?: string;          // "product" / "tool" + the one-liner; Transcenda has none
  meta?: string;                         // store line as displayed, e.g. "1M+ · 4.5★" (ivi)
  points: string[];
  projects?: CvProject[];                // Transcenda only
}
export interface CvProject {
  id: string; name: string; icon?: ImageRef;   // no icon (SpotOn): the gradient initials tile
  domain: string; meta: string; about: string; points: string[];
}
```

- **Reused shapes.** `HeadlinePart`, `AgentLoop`, `LoopStep`, `ImpactCard`, `SkillGroup`,
  `Education`, `FooterCta` (`profile.ts`) and `Book`, `ImageRef` (`models.ts`) are imported as
  they are. Cleanup moves them into `cvPage.ts` when it deletes `profile.ts` and the old `Cv`.
- **Content vs strings.** Section headings and fixed words are UI strings in the screen's
  namespace, as in `profile/strings.ts`. That covers "Code craft × agentic process", "How I build
  with agents", "system with feedback", "Selected impact", "Experience", "Skills", "education",
  "about me", "Email me", the handle `~/andrew.panasiuk/cv` and the ©. Everything about Andrew is
  data. The **look** is not data: card tones (impact lilac → pink → neutral, craft neutral →
  pink) are set by position in the screen. Only emphasis is data (`accent`), as `HeadlinePart`
  already does.
- **Ids** are stable slugs, used as React keys and as agent targets:
  - stats: `years`, `users`, `platforms`, `ai`
  - craft: `before-ai`, `with-agents`
  - loop steps: `frame`, `tickets`, `sessions`, `pr`, `ci`, `retro`
  - impact: `users`, `design-system`, `ai-features`
  - jobs: `ai-cv`, `transcenda`, `wisehouse`, `attendify`, `rosfines`, `smartling`, `rokkit`,
    `ivi`, `samsung`
  - projects: `spoton`, `cync`, `august-home`
  - skills: `agentic-development`, `android`, `architecture`, `ios`, `product`,
    `ai-engineering`
  - books: `the-goal`, `a-pattern-language`, `antifragile`, `siddhartha`
  - contacts: `email`, `whatsapp`, `telegram`, `linkedin`

  `cvPageIds.test.ts` checks that ids are unique per list and that the contact ids equal
  `CV_CONTACT_CHANNELS`.
- **Images.** `ImageRef` ids: `photo`, `logo_<company>`, `app_cync`, `app_august`,
  `book_<slug>`. The page screen resolves them in `src/screens/home/images.ts`, as `profile` does,
  from `src/screens/home/assets/home_*` (copied from `docs/design/v3/assets/`).
  - Samsung uses `cv_logo_samsung_hq2.png`.
  - The first job ("AI-powered CV") uses `photo` as its logo.
  - `cv_app_savant.png` is not used.
  - SpotOn has no `icon`: the screen draws the initials tile from the name's first letter.
- Contacts follow the design: `mailto:andriipanasiuk@gmail.com`, `https://wa.me/380938977110`,
  `https://t.me/+380938977110`, `https://www.linkedin.com/in/andriipanasiuk/`. The email
  contact's `label` is the address (the footer pill shows it). The other labels are the channel
  names. The header button says "Email me" (a string).
- Not in the data: the phone number (the design has none), the "Live AI CV" row, apps outside
  Transcenda, earlier jobs.

## Decision 2: One URL; `/new` redirects to `/`

`vercel.json` replaces the two `/new` rewrites with redirects:
`{ "source": "/new", "destination": "/", "permanent": false }` and the same for `/new/`. The app
shows the one page for any path; `src/app/routes.ts` (`pageFor`, `Page`) is deleted once the chat
no longer needs a page id.

| Option | Assessment |
|---|---|
| **A. Redirect in `vercel.json` (chosen)** | One canonical URL, so search engines don't see duplicates. No route logic in the app. Old links work. `#ask` survives the redirect (browsers keep the fragment). Query strings (`?retro=1`) should pass through; the orchestrator checks with `curl -I '<prod>/new?retro=1'` after T3 merges, and if the query is dropped, T3's follow-up adds `/new?:query*`-style rules. |
| B. Alias in `routes.ts` (`/new` renders the same page) | Also works, but the site has two URLs for one page and keeps a routing function with one answer. |

- `permanent: false` (307): browsers don't cache it, so `/new` stays free for later use. Locally,
  `vite dev`/`preview` serve `index.html` for `/new` (SPA fallback), which shows the same page;
  the e2e specs use `/`.
- **Meta bar.** It belongs to the page screen. On the left is the handle. On the right are
  location and work mode, then a line with "Open to roles" and the shell's end slot. The slot now
  holds only the **Show case** button (mono pill, desktop ≥ 1024 px). The language switcher is
  removed (Decision 6).
- **Anchors.** No `id` anchors and no section menu (out of scope). **`#ask`** still opens the chat
  (`useAskHash`), but nothing on the page links to it any more. The **"Ask my AI" pill** is the
  chat's launcher: a restyle of `ChatLauncher`, still owned by the chat. It is not a link.
- **Agent targets** (`data-agent-id`, set with `agentTargetProps`):
  - Sections, in page order (`CV_SECTION_IDS`): `header` (meta bar, header, stats, contact
    buttons), `craft`, `loop`, `impact`, `experience`, `skills`, `education`, `about`, `contacts`
    (the footer call to action).
  - Items: `impact:<id>`, `experience:<id>` (the job's article; for Transcenda it includes the
    project tree), `app:<id>` (the three Transcenda projects), `skill:<id>`, `book:<id>`, and
    `contact:<channel>` on the **header** buttons. The footer pills carry no id, because each id
    appears once in the DOM.
  - 38 targets in total.
  - Not targets: stats, craft cards, loop steps (their section is), the meta bar.
- **Hooks** (test ids in `src/screens/home/testIds.ts`, prefix `home-`). They are the contract for
  the show's layers (Decision 4), so they are fixed here:
  - Page parts: `home` (root), `home-meta-bar`, `home-header`, `home-photo`, `home-name`,
    `home-headline`, `home-summary`, `home-stat`, `home-contact`.
  - Sections: `home-craft`, `home-loop`, `home-impact`, `home-experience`, `home-skills`,
    `home-education`, `home-about`, `home-footer`.
  - Items: `home-craft-card`, `home-loop-step`, `home-impact-card`, `home-job`, `home-project`,
    `home-skill`, `home-book`, `home-footer-link`.

## Decision 3: Chat `v: 4`, one page, no locale; v1 and v2 retired in Cleanup

The chat's request drops the page and the language: `{ v: 4, messages }`. Question snapshots lose
`route` and `locale`. The catalogue is the page's three tools; `switchLanguage` is gone. The
exact contract is in API.md → v4.

| Option | Assessment |
|---|---|
| **A. `v: 4` without `page`/`route`/`locale`, v2 served until Cleanup (chosen)** | The enums change in ways that break old clients (sections, kinds, contact channels; `switchLanguage` goes). By API.md → Versioning that is a bump. Old tabs keep working on v2 until Cleanup, then get `unsupported_version`, which the widget already shows as "The chat has been updated. Please reload the page." The final contract has no fields that only ever hold one value. |
| B. Stay on `v: 2` with a new page id `home` | No bump, and the per-page machinery is reused. But the final contract keeps a `page` field with one value and a `locale` with one value. Removing `cv`/`profile` later breaks old tabs with a generic error instead of the reload notice. |
| C. Stay on `v: 2`, page `cv` now means the new page | Silently changes the meaning of `cv`. Old `/` tabs would send old section ids and get `400 invalid_request` ("Something went wrong"). |

- **`locale`.** Dropped from v4. The page is English, so the knowledge and the catalogue are
  English. The reply language is unchanged: the model "replies in the language of the visitor's
  latest message", and the system's site-language line is fixed to
  `Site language: English (en).`. So a question in Ukrainian still gets an answer in Ukrainian,
  grounded in English content. Pinning `locale: 'en'` was rejected: it is a field with one value.
  v3 (the show) keeps its `locale: "en"` and stays unchanged on the wire (no bump for the show).
- **Knowledge.** `renderCvPage(page)` produces `<document id="cv" title="CV">`: compact Markdown
  like `renderProfile`, with English headings and everything the page shows as text (meta,
  header, summary, stats, contacts with their values, craft, loop, impact, jobs with projects,
  skills, education, about). It leaves out image refs and the footer CTA (its email is a
  contact). It is deterministic. `CvPageKnowledgeSource` is loaded once, giving **one cached
  prefix** where there are three today.
- **Prompt.** `INSTRUCTIONS` text is unchanged. `PAGE_TOOL_INSTRUCTIONS` loses "switch the
  language" and the `locale` in `<page_state>`. That block is shared with v2 until Cleanup, which
  is harmless. `PROMPT_VERSION` is bumped.
- **Suggestions.** Four, plus three example commands, in `src/screens/chat/strings.ts` (UI copy,
  as ADR-0004 Decision 5):
  - "How does he build with AI agents?"
  - "What impact has he had?"
  - "Which apps has he shipped?"
  - "Is he open to new roles?"
  - Commands: "Show his selected impact", "Highlight his work at Transcenda", "Scroll to his
    contacts".
  - The chat's subtitle and greeting are the `/new` ones ("answers from this page").
  - The Chat task posts the final texts on its ticket for the human.
- **Labels and confirmations** come from `CvPage`:
  - impact → `value`; experience → `company`; app → `name`; skill → `title`; book → `title`;
    contact → its `label`.
  - Sections → chat strings: header "Top of the page", craft "Code craft", loop "How I build with
    agents", impact "Selected impact", experience "Experience", skills "Skills", education
    "Education", about "About me", contacts "Contacts".
  - `openContact` confirms with the contact's label and opens its `href` (new tab for http(s)).
- **Size and cost** (estimated from the design's text: about 6,800 chars, so the knowledge is
  about 7,000 chars):
  - Knowledge ≈ 2,000 tokens, tools ≈ 550 (38 targets), shared blocks ≈ 1,420. The static
    prefix is **≈ 4,000 tokens**, about `/new` EN today.
  - On Haiku 4.5 that is just under the 4,096 minimum cacheable prefix: the first question may not
    cache, and the automatic marker caches once the history passes it. On Sonnet 5.5 it caches
    from the start.
  - Roughly $0.004 per uncached request on Haiku. The daily budget and limits are unchanged.
  - The Data + backend task records the real `buildLlmRequest` sizes in API.md.

## Decision 4: One show, `retro-4`, ported from `/new`'s scenario

The Show case survives with one scenario, **`retro-4`**: `retro-new-1` (the `/new` show) ported to
the v3 page's hooks and tokens. It keeps the same eight step ids and flow (2001 page, DevTools, `//`
narration, silent chat, collapse), and ends on the real v3 page with zero layers. Detail and guards
are in ARCHITECTURE §11.

| Option | Assessment |
|---|---|
| **A. Port `retro-new-1` (chosen)** | `/new` is the page closest to v3: the same blocks (impact, the dark loop panel, experience, skills, education/about cards, footer CTA, books) in a similar order. Most of its 32 layers map one-to-one onto `home-*` hooks. |
| B. Port `retro-3` (`/`) | Written for blocks v3 doesn't have (technology cards, rich-text summary, latest/previous experience). About half of it would be new design work. |
| C. Drop the show | Against the project's scope decision 5. |
| D. Keep the per-page engine and register v3 as a third page | The registry, scenario ids per page and the `page` field in manifests would stay for one page. Speculative. |

- **Manifest** (`src/data/retro`):
  - `scenario.ts` becomes `retro-4`. Step titles are as today. Intents and fallbacks come from
    `scenarioNew.ts`, reworded where they name v3 content: the stats and craft cards; the
    Transcenda project tree instead of app pills; the contact buttons and the "Ask my AI" pill
    instead of contact rows; the meta bar without a language switcher.
  - `scenarioNew.ts` is deleted.
  - The `SHOW_SCENARIOS` registry keeps one entry and loses the manifest's `page` field (replies
    ground in the one page's knowledge).
  - `retro-3` and `retro-new-1` become unknown ids, so old show tabs get `unsupported_version`
    and run scripted (API.md v3, as designed).
- **Source** (`src/screens/retro`): one source, one flat `layers/` set.
  - The 17 shared files plus `new/`'s 15 are re-targeted from `forest-*`/`profile-*` test ids to
    the `home-*` hooks, and from `--forest-*` to the v3 token names (Decision 5).
  - `/`-only layers and `layers/new/` are deleted.
  - A v3 block without a 2001 equivalent (stats, craft cards, the project tree, footer pills) is
    covered by the concern layers that already break its kind (surfaces, radii, type), or by one
    new chunk in the matching step if a guard requires it.
- **Server** (`server/chat/show`): replies ground in the `CvPage` knowledge from the Data +
  backend task's loader. The outline is rendered from the `retro-4` manifest. The show prompt
  version is bumped.

## Decision 5: Look-neutral v3 tokens; components owned by the page screen

**Tokens.** The v3 tokens get role names without a look prefix, so the next redesign changes values,
not names (the `--forest-*` lesson):

| Group | Names |
|---|---|
| Colours | `--color-page` `#F2EEF8`, `--color-card` `#FFFFFF`, `--color-ink` `#16131C`, `--color-ink-2` `#2A2433`, `--color-ink-3` `#5E5770`, `--color-ink-4` `#8C859A`, `--color-accent` `#8A3FE0`, `--color-accent-hover` `#D9328F`, `--color-accent-pink` `#C0267C`, `--color-on-accent` `#FFFFFF`, `--color-surface` `#F7F4FB`, `--color-surface-pink` `#FDE6F3`, `--color-surface-lilac` `#F4EAFE`, `--color-surface-violet` `#EFE5FC`, `--color-line` `#ECE6F3`, `--color-tree-line` `#C7B5EC`, `--color-status` `#15803D`, `--color-status-dot` `#16A34A`, `--color-dark-ink` `#F4F2F7`, `--color-dark-line` `#3A3248`, `--color-dark-number` `#FF7ACB`, `--color-dark-note` `rgba(255,255,255,.85)` |
| Gradients, shadows | `--gradient-brand` (90°), `--gradient-brand-tile` (135°), `--gradient-dark` (the loop panel), `--gradient-footer`; `--shadow-card`, `--shadow-dark`, `--shadow-cta`, `--shadow-launcher` |
| Fonts, type | `--font-sans` (`'Figtree', system-ui, sans-serif`), `--font-mono` (`'JetBrains Mono', ui-monospace, monospace`); `--type-<role>-{size,weight,line-height,letter-spacing}` for the SPEC's roles (h1, h2, name, tagline, summary, stat, card-title, body, label, meta, tag, company, role, period, impact, loop-lead, footer-title, button); `clamp()` values stay fluid |
| Radii, layout | `--radius-{page,card,tile,pill,logo,book}`; `--page-{max-width,padding-x,section-gap}`; the existing `--space-*` scale |

- The Theme task fixes the exact list and values in `tokens.css` and `src/theme/AGENTS.md`. Names
  that clash with today's tokens (`--color-text-secondary`, `--font-body-*`) stay until Cleanup.
- `--agent-highlight-color` now points at `--color-accent`.
- **Fonts:** Figtree 400/500/600/700 and JetBrains Mono 400/500, **latin only**, self-hosted with
  `@fontsource` like today. No Cyrillic fallback (Decision 6). Onest and IBM Plex Sans leave in
  Cleanup.
- **Components.** The page's components live in **`src/screens/home/`**: one screen uses them
  (`docs/COORDINATION.md` → Hot spots, "a component lives in its screen folder first"). The v3
  blocks differ from the Forest ones in markup (stats, craft cards, logo tiles, the project tree,
  pills), not only in colour.
  - `src/shared/forest/` is not restyled; it is deleted in Cleanup.
  - `ShowCaseButton` moves to `src/shared/ShowCaseButton/` (the shell renders it), restyled as a
    v3 mono pill, test id `show-case`.
  - `src/shared/agentTarget` and `src/shared/chat` stay. The chat is restyled to the v3 palette:
    the panel's dark surfaces use the loop panel's colours; the launcher becomes the "Ask my AI"
    pill.
- Rejected: restyling `src/shared/forest` in place. One PR would change both old pages and the
  show layers that read `--forest-*`, and the shared folder would keep names of a retired look.

## Decision 6: English only; `src/i18n` becomes a thin EN strings layer

- **Removed:**
  - the `uk` locale and its detection/persistence (`cv.locale`, `navigator.language`);
  - the language switcher;
  - the `switchLanguage` tool;
  - every `uk` strings block;
  - `profile.uk.json` and UK server knowledge;
  - the `uk-UA` e2e cases.
- **Fixed:** `<html lang="en">` (already in `index.html`; the provider that rewrites it goes).
- **`src/i18n` keeps `defineStrings({ en })` and `useStrings(ns)`.** `useStrings` returns
  `ns.en` without a context. Removed: `locale.ts`, `I18nProvider`, `I18nContext`, `useLocale`,
  `Locale`, `LOCALES`.

| Option | Assessment |
|---|---|
| **A. Thin EN-only layer, same API (chosen)** | No component call site changes: each surviving `strings.ts` only drops its `uk` block. Strings stay out of components in one shape, which a future language could extend. |
| B. Plain constants per screen (`homeStrings.title`) | No vestigial `{ en }` wrapper, but every component that reads strings changes: the most churn for no behaviour. |

**When.** `defineStrings` already treats `uk` as optional (missing keys fall back to `en`), so new
code writes English only from day one, and the UK leftovers in old code go with that code:
- **Theme task:** the visible change on the live site. The switcher leaves the shell,
  `switchLanguage` is no longer registered, detection always gives `en`, the Show case drops its
  locale check, and the `uk` e2e cases go.
- **Cleanup:** the machinery and the remaining `uk` blocks (`common.ts`; the old screens' blocks
  die with the screens).

Old pages keep a stale "Switch the page to Ukrainian" chat command until the Chat task replaces
the commands; the tool then answers `not_available`.

## Decision 7: Removal, by task

| What goes | Task |
|---|---|
| Language switcher (`src/shared/LanguageSwitcher/`), `switchLanguage` registration, locale detection, `uk` e2e cases | T1 Theme |
| `CvRoute`/`ProfileRoute` from the shell (files stay until Cleanup), the `/new` rewrites, `e2e/retro.spec.ts`, `e2e/retroNew.spec.ts`, the old-page agent e2e cases, `ShowCaseButton` in `src/shared/forest` | T3 Page |
| Chat page id plumbing (`page` prop, `pageContent` per page, `profile*` chat strings, `routes.ts`), the chat's `uk` block | T4 Chat |
| `retro-3`'s and `retro-new-1`'s manifests, sources, layers and chunks; the per-page parts of the show (`page` in manifests, `RetroShowSource.page`) | T6 Show |
| `src/screens/cv/`, `src/screens/profile/`, `src/shared/forest/`, `Cv`/`Profile`/`CvRepository`/`ProfileRepository` and their contexts, `cv.en.json`, `profile.*.json`, `cvIds`/`profileIds` tests; v1 and v2 on the server (validation, `renderCv`, `renderProfile`, per-page sources and tools) and their contract parts (`ChatRequest` v1, `ChatRequestV2`, `CHAT_PAGES`, `CHAT_PAGE_ROUTES`, `AGENT_SECTION_IDS`, `PROFILE_*`, `AGENT_PAGE_*`, `technology` kind, `switchLanguage`, `buildAgentToolSpecs(cv)`, `buildProfileToolSpecs`, `ChatLocale` outside v3); `--forest-*` and the other pre-v3 tokens, Onest, IBM Plex Sans and the unused Inter package; the i18n locale machinery; `common.ts` `uk` | T7 Cleanup |

v1 has had no client since v2 shipped. It goes with v2 so the server serves exactly v3 (show) and
v4 (chat).

## Build split

Seven tasks. Zones don't overlap within a parallel step; two tasks that share a file are always
ordered.

```
T1 Theme + English only ─┐
                         ├─→ T3 Page (flip) ─→ T4 Chat ─┬─→ T5 Chat look ─┐
T2 Data + chat v4 ───────┘    (T3, T4 merge back to back) └─→ T6 Show ──────┴─→ T7 Cleanup
```

- **T1 ∥ T2.**
- **T3** needs both: it uses T1's tokens and T2's model.
- **T3 and T4 merge back to back.** T3 flips `/` to the new page. T4 switches the chat to it.
  The orchestrator holds T3's reviewed PR until T4 passes review, then merges T3 and T4 in a row,
  so production never shows the new page with the old chat's targets for more than one deploy.
  T4 starts on T3's branch (`Starts on branch of: T3`).
- **T5 ∥ T6** after T4.
- **T7** last.

Contract files each later task codes against:
- T2's **first commit**: `src/data/cvPage.ts`, `src/data/CvPageRepository.ts`, the v4 block of
  `src/data/chat/contract.ts`, and `cvPageTargetIds`/`buildCvPageToolSpecs` in `agentTools.ts`.
- T3's **first commit**: `src/screens/home/testIds.ts` with the hooks above.

Exact paths, sizes and done-when for each task are in the CV-107 ticket comment "Build split".
They also appear in API.md → v4 (T2/T4) and ARCHITECTURE §11 (T6).

## Consequences

- **Easier.** One page, one model, one knowledge block, one cached prefix, one catalogue, one
  show. There is no page id or locale anywhere in the chat. A redesign is a token change, because
  the names are role names.
- **Harder.**
  - During the build, two models, two chat versions and two token sets live side by side, and
    Cleanup must remove all of it.
  - Production has a short window between T3 and T4 (held PRs, back-to-back merges).
  - The show's layers are a contract on `home-*` hooks; T3 must deliver them as listed.
  - Visitors who preferred Ukrainian lose it; the chat still answers in their language.
- **Revisit:** a second language (then `defineStrings` gets its second key again, and the chat a
  `locale`, in a new version); a real backend for `CvPageRepository`.

## Action items

1. [ ] Orchestrator: file T1–T7 from the ticket's Build split comment.
2. [ ] Orchestrator: root `AGENTS.md`, `docs/COORDINATION.md` (Design source of truth →
   `docs/design/v3/`; Scaffold decisions: routes, i18n, data) per the edit list on the ticket.
3. [ ] T2: measured prefix sizes into API.md → v4; golden check with the real model when CV-45
   runs.
