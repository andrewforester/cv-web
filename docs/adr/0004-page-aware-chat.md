# ADR-0004: The AI chat knows which page it is on

**Status:** Proposed (CV-94)
**Date:** 2026-10-02
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [`docs/chat/API.md`](../chat/API.md) (→ Page-aware chat), [`docs/chat/AGENT.md`](../chat/AGENT.md),
[ADR-0001](0001-ai-cv-chat.md), [ADR-0002](0002-page-agent-tools.md), CV-84 (`/new`), CV-95 (the show on `/new`)

## Context

The floating chat runs on both pages: `/` (today's CV, model `Cv`, `src/data/mock/cv.en.json`) and
`/new` (the Forest profile, model `Profile`, `profile.{en,uk}.json`). It knows only `/`:
`CvKnowledgeSource` loads only the CV; the client always sends `page.route: '/'`
(`useChatConversation.ts`), and the server rejects any other route (`validateParts.ts`
`checkPage`); the tool catalogue (`buildAgentToolSpecs(cv)`), `AGENT_SECTION_IDS` and the
browser catalogue (`src/agent/AgentProvider.tsx`) are built from `Cv`; `/new` registers no tools.
On `/new` the chat therefore answers about a different page than the visitor sees and can't
operate it.

Goal: on each page the chat (1) answers from that page's content in EN and UK, (2) offers four
first questions that fit that page, (3) drives that page with the four agent tools, using that
page's sections and items. Scope defaults of the project (the human may change them): the chat
answers only about the page it is on; a conversation is not shared between pages; `/new`'s UK
knowledge comes from `profile.uk.json`; 4 suggestions per page and locale; the same four tools on
`/new`; no cross-page navigation or answers about the other page. Constraints from ADR-0001/0002
hold: stateless function, no storage, byte-stable cached prefix, tests never call a real model.

## Decision 1: The page identifies itself by a page id, sent once per request

`ChatRequestV2` gets an optional top-level `page: ChatPage` (`'cv' | 'profile'`, the ids
`pageFor` in `src/app/routes.ts` already returns). The app shell reads it from
`pageFor(location.pathname)`, as it already does: `App` passes it to the chat
(`<Chat page={page} />`), `AppProviders` to the agent registry (`<AgentProvider page>`; a `page`
prop overrides it in tests). The snapshot's `route` stays and now says the page's path
(`CHAT_PAGE_ROUTES`: `cv` → `/`, `profile` → `/new`); the server requires every question's
`page.route` to match the request's page.

| Option | Assessment |
|---|---|
| **A. Page id, top-level field (chosen)** | Knowledge, prompt and tools are request-level, so the selector is too; follow-ups carrying only tool results need no scan of the history. Stable when URLs move (`/new` may become `/` one day: only `routes.ts` and `CHAT_PAGE_ROUTES` change, the id and the server's choice don't). |
| B. The snapshot's `route` as identity (first question decides) | No new field, but couples the contract to URLs and gives "which page" a per-message home for a per-request decision. |
| C. Server infers from `Referer` | Not in the contract, stripped by referrer policies, untestable; rejected. |

Absent `page` means `cv`, so a tab opened before the release behaves exactly as today. An unknown
page id is `400 invalid_request` (a newer client than server can't happen: the site and the
function deploy together).

## Decision 2: Stay on `v: 2`; the change is additive

`page` is a new optional request field and the per-page enums only widen existing unions
(`AgentPageState.route`, `activeSection`, `AGENT_TARGET_KINDS`); responses, SSE events, limits
and error codes don't change. By API.md → Versioning that keeps `v: 2` and
`X-Chat-Api-Version: 2`.

| Option | Assessment |
|---|---|
| **A. v2 + optional `page` (chosen)** | No new version constant, validator branch or duplicated `…V2` types; old tabs keep working by the default. |
| B. `v: 4` with a required `page` | Guards against a client newer than the server, which atomic deploys rule out; doubles the types and the validator for no behaviour. (v3 got its own number because a show request is a different dialect an old server would misread wholesale; a chat request with a page is still a chat request.) |

Back compatibility: **v1** is unchanged (CV only; a `page` field is ignored like any unknown
field). **v2 without `page`** gets today's `/` request byte for byte (same knowledge, tools,
system blocks, cache prefix). **v3** (the show) is unchanged and keeps the CV knowledge; whether a
show on `/new` uses `/new`'s knowledge is CV-95's decision (its `scenario` id can select it).

## Decision 3: Knowledge per page; shared instructions stay byte-identical

- Knowledge sources are registered per page: `cv` → `CvKnowledgeSource` (as today),
  `profile` → a new `ProfileKnowledgeSource` rendering the profile with `renderProfile`
  (`<document id="profile" title="Profile">`). The loader is memoized per (page, locale).
- **Locale rule, the same on both pages: the knowledge is what the page shows in that locale.**
  `/` shows `cv.en.json` in both languages (there is no `cv.uk.json`; the site falls back to
  English), so its knowledge stays English for `uk`, as today. `/new` shows `profile.uk.json` in
  Ukrainian, so its `uk` knowledge is that file.
- `renderProfile` follows `renderCv`: compact Markdown, English headings (structure for the
  model), content verbatim in the locale; everything the page shows as text (meta facts, name,
  headline, subtitle, lead, contacts, impact, the loop, jobs, earlier jobs, apps, skill groups,
  education, books, about). Dropped: image refs, the "Live AI CV" (`ai-chat`, `#ask`) row (a link
  to the chat, not a contact) and the footer CTA (its email is already a contact). Deterministic.
- The system blocks keep their order and text: `INSTRUCTIONS`, `PAGE_TOOL_INSTRUCTIONS`,
  knowledge (cache marker), locale line. No per-page instruction text: they read correctly on
  both pages ("Andrew Panasiuk's CV website", "the contacts on this page"), and the page's content
  and tools differ through the knowledge and the catalogue. That keeps `/`'s request identical and
  one prompt to golden-check. `PROMPT_VERSION` is bumped (new combination for `/new`), and the log
  line gets `page`.
- Rejected: one knowledge block with both pages (answers about the other page, bigger prompt,
  against the scope); separate instruction prompts per page (two prompts to keep in sync and to
  check, for a difference the knowledge already carries).

## Decision 4: `/new`'s sections, targets and catalogue

Sections, page order (`PROFILE_SECTION_IDS`): `header` (meta bar, hero, lead, contacts),
`impact` (01), `loop` (02, "How I build with agents"), `experience` (03, jobs + earlier), `apps`
(the app pills inside 03, as on `/`), `skills` (04), `education` and `about` (the two 05 cards),
`footer` (the closing call to action).

Item targets, `data-agent-id="<kind>:<id>"` with the `Profile` ids (equal in every locale, checked
by `profileIds.test.ts`): `impact:<id>` (impact cards), `experience:<id>` (jobs, then earlier jobs),
`app:<id>`, `skill:<id>` (skill groups), `book:<id>`, `contact:email`, `contact:phone`. Kinds keep
their meaning across pages (`experience`, `app`, `book`, `contact`, `section`); two are new
(`impact`, `skill`). Not targets: loop steps (the `loop` section is), the meta bar facts, the
`ai-chat` contact row.

Tools: the same four. `openContact` on `/new` takes only `email` and `phone`
(`PROFILE_CONTACT_CHANNELS`); `scrollToSection` and `highlightElement` take `/new`'s enums. The
catalogue is `buildProfileToolSpecs(profile)` next to `buildAgentToolSpecs(cv)` (unchanged), both
in `src/data/chat/agentTools.ts`; the server builds both once from the English JSON
(`LLM_TOOLS_BY_PAGE`), the browser builds the page's one from the same function. Exact specs in
API.md → Page-aware chat.

How the Forest components carry targets without knowing the page: they already take
`attributes` (`DataAttributes`, `src/shared/forest/dataAttributes.ts`) and spread them as is; the
screen computes them with `agentTargetProps(kind, id, highlightedId)`. That helper (and its
highlight CSS) moves from `src/screens/cv/` to `src/shared/agentTarget/` so both screens use one
copy. Three blocks gain `attributes`: `ImpactCards` (per item), `EarlierRow` (per item) and
`FooterCta`; the rest (`PageHeader`, `Section`, `JobRow`, `AppPills`/`AppPill`, `SkillsGrid`,
`InfoCard`, `BookCovers`, `ContactRows`) already have them.

## Decision 5: Suggestions are strings per page in the chat namespace

The four first questions (and the three example commands) are UI copy, so they stay in
`src/screens/chat/strings.ts` (`defineStrings`, a missing UK key fails `tsc`), chosen by the
chat's `page`. `/` keeps today's keys and texts. `/new` adds `profileSuggestion1…4` and
`profileCommand1`; `command2`/`command3` (switch language, scroll to the apps) fit both pages and
are shared. The texts below are the starting point; per the project's scope (d) CV-97 lists the
final ones on its ticket for the human to adjust:

| Key | EN | UK |
|---|---|---|
| `profileSuggestion1` | What does he build with AI? | Що він створює з ШІ? |
| `profileSuggestion2` | How does he work with coding agents? | Як він працює з агентами для програмування? |
| `profileSuggestion3` | What impact has he had? | Яких результатів він досяг? |
| `profileSuggestion4` | Which apps has he worked on? | Над якими застосунками він працював? |
| `profileCommand1` | Show his selected impact | Покажи його вибрані результати |

Rejected: suggestions in the profile JSON (they are not facts about Andrew; a future CV-editing
backend shouldn't own chat microcopy). New section labels for the action chips (`impact`, `loop`,
`experience`, `skills`, `footer`) are chat strings too; `header`, `apps`, `education`, `about`
reuse today's keys.

A conversation is per page by construction: the pages are separate documents (no client router)
and the conversation lives in memory, so switching pages starts a new chat. The chat's title,
greeting and disclaimer stay the same on both pages.

## Prompt size and cost (measured)

Measured on the real JSON on 2026-10-02 (`renderCv`, the knowledge wrapper, `LLM_TOOLS`; for
`/new` a draft `renderProfile` and catalogue written to Decisions 3–4). Characters are exact;
tokens are estimates (3.5 chars/token for English, the code's `CHARS_PER_TOKEN`; ~2 chars/token
assumed for Cyrillic), because no API key was available for `count_tokens`.

| Part | `/` (EN = UK) | `/new` EN | `/new` UK |
|---|---:|---:|---:|
| Knowledge block, chars (bytes) | 4,009 (4,009) | 5,324 (5,375) | 5,679 (8,767; 3,027 Cyrillic) |
| Knowledge, ≈ tokens | 1,150 | 1,520 | 2,270 (1,970–2,780) |
| Tools JSON, chars (≈ tokens) | 2,121 (610) | ≈ 2,150 (615) | same as EN |
| Shared: instructions 2,614 + page-tool rules 1,143 chars + tool-use system prompt (~350) | ≈ 1,420 | ≈ 1,420 | ≈ 1,420 |
| **Static prefix, ≈ tokens** | **≈ 3,180** | **≈ 3,560** | **≈ 4,300 (4,000–4,800)** |
| Highlight targets in the enum | 36 | 36 | 36 |

**As built (CV-96, `buildLlmRequest` output on the real JSON):** knowledge `/new` EN 5,223 chars (≈ 1,490 tokens), `/new` UK 5,580 chars (≈ 2,240 tokens), `/` unchanged at 4,009; tools JSON 2,137 chars for `/new`; static prefix ≈ 3,180 (`/`), ≈ 3,530 (`/new` EN), ≈ 4,280 (`/new` UK) tokens. About 100 chars under the draft; the caching conclusions below hold. Real `count_tokens` still waits for CV-45.

- **Caching.** Tools render first, so each page has its own cached prefix, and `/new` has two
  (its knowledge differs per locale): three cache entries per model instead of one. On Haiku 4.5
  (minimum cacheable prefix 4,096 tokens) `/` and `/new` EN don't cache on the first request (as
  today); `/new` UK sits around the threshold and may. The top-level automatic marker caches
  every page once prefix + history passes 4,096. On Sonnet 5.5 (minimum 512) every prefix caches
  from the first request; a cold write per page and locale after 5 idle minutes costs about
  $0.01. Switching the language on `/new` changes the knowledge, so the next request writes a new
  prefix (on `/` it doesn't).
- **Cost.** Haiku 4.5 at $1/M input: a `/new` request costs about $0.0004 (EN) to $0.0011 (UK)
  more than a `/` request uncached, i.e. under one cent per conversation; output is unchanged.
  Far below `KNOWLEDGE_WARN_TOKENS` (50k). The daily budget and limits are unchanged.
- **To confirm:** the backend task records `count_tokens` for the three prefixes, or the first
  real-model run (CV-45) reads them from the log (`inputTokens`, `cacheWriteTokens`), and corrects
  this table.

## Test plan (what the build tasks must meet)

No test or CI job calls a real model; the golden check of `/new` on the real model waits for
CV-45.

Backend (Vitest `server` project, `FakeLlmClient` recording the `LlmRequest`):
1. **`/` unchanged:** a v2 request without `page`, and one with `page: 'cv'`, build an
   `LlmRequest` equal to today's (same tools, system blocks, knowledge bytes, cache markers); v1
   and v3 tests pass untouched.
2. **Knowledge per page:** `page: 'profile'` → the system has `<document id="profile"` with
   `/new`'s EN text; `locale: 'uk'` → the UK text; the CV text is absent; tools are `/new`'s
   catalogue (`openContact` enum `email`, `phone`; `scrollToSection` enum `PROFILE_SECTION_IDS`).
3. **Validation:** unknown `page` → `400 invalid_request`; `page: 'profile'` with a question whose
   `route` isn't `/new` → 400; `activeSection` checked against the page's sections; `impact:` and
   `skill:` targets accepted in `highlighted`.
4. **`renderProfile`:** every section present, no image refs, no `#ask` row, deterministic, EN
   and UK differ. **Catalogue:** `buildProfileToolSpecs` is deterministic and identical for EN
   and UK; its targets are exactly the `Profile` ids. The log line carries `page`.

Frontend (Vitest `web` project, Testing Library; Playwright with a mocked `/api/chat`):
5. **Suggestions per page:** the chat on `profile` shows `/new`'s four suggestions in EN and UK;
   on `cv` today's.
6. **Request:** on `/new` the body has `page: 'profile'` and `route: '/new'` (fake repository).
7. **Agent on `/new`:** every id of `profileTargetIds(profile)` is in the DOM exactly once; the
   registry runs `scrollToSection` (`impact`) and `highlightElement` for each kind; `openContact`
   offers email and phone with `/new`'s values; the `ai-chat` row carries no `data-agent-id`;
   action chips name `/new`'s items (e.g. "Transcenda").
8. **e2e:** opening the chat on `/new` (e.g. `/new#ask`) shows `/new`'s suggestions in both
   locales; a scripted `scrollToSection` `impact` brings `section:impact` into view; `/`'s existing
   chat and agent specs pass unchanged.

## Build split

Two tasks in parallel; no file is in both zones. The frontend task starts on the backend's branch
once its first commit (the contract files) exists, and merges after it.

**Backend (CV-96):** first commit = the contract: `src/data/chat/contract.ts` and
`src/data/chat/agentTools.ts` exactly as API.md → Page-aware chat (additive: the frontend still
compiles), with `contract.test.ts` / `agentTools.test.ts`. Then:
- `server/chat/knowledge/`: `renderProfile.ts`, `ProfileKnowledgeSource.ts`, `sources.ts` (per
  page), `assembleKnowledge.ts` (loader per page and locale), `knowledge.test.ts`.
- `server/chat/prompt/`: `llmTools.ts` (`LLM_TOOLS_BY_PAGE`), `buildLlmRequest.ts` (+ tests),
  `systemPrompt.ts` (`PROMPT_VERSION` only).
- `server/chat/`: `validate.ts`, `validateV2.ts`, `validateParts.ts` (`page`, route per page,
  sections per page), `handler.ts`, `deps.ts` (the loader's wiring), `log.ts` (`page`), their
  tests, `server/chat/show/planShow.ts` (keeps CV knowledge), `server/test/helpers.ts`.
- Package docs: `server/chat/**/AGENTS.md`, `src/data/chat/AGENTS.md`, `src/data/mock/AGENTS.md`
  (the chat now knows the profile).

**Frontend (CV-97):**
- `src/app/App.tsx` (pass `page` to the chat), `src/app/AppProviders.tsx` (pass `page` to
  `AgentProvider`, from `pageFor` or a test prop), `src/app/useLazyChat.ts` (the chat's props), app tests.
- `src/agent/AgentProvider.tsx` (catalogue for the page: `buildAgentToolSpecs` or
  `buildProfileToolSpecs`), `src/agent/AGENTS.md`, its tests.
- `src/screens/chat/`: `ChatRoute.tsx` (`page` prop), `useChatConversation.ts` (`page`,
  `route`), `useChatState.ts` + `ChatUiState.ts` (the page's suggestion and command texts in the
  UI state, so the stateless components stay page-agnostic), `ChatPanel.tsx`, `MessageList.tsx`,
  `SuggestedQuestions.tsx`, `actionLabels.ts`, `actionText.ts`, `runToolCalls.ts` (labels and
  confirmations from `Cv` or `Profile`), `strings.ts`, tests, `AGENTS.md`.
- `src/screens/profile/`: `useProfileAgentTools.ts` (new), `useProfileState.ts`,
  `ProfileUiState.ts`, `ProfileRoute.tsx`, `ProfileScreen.tsx`, `ProfileHeader.tsx`,
  `ProfileExperience.tsx`, `ProfileCards.tsx`, `ProfileRoute.agent.test.tsx` (new), `AGENTS.md`.
- `src/shared/agentTarget/` (new: `agentTargetProps` + CSS moved from `src/screens/cv/`, plus the
  scroll / open-link helpers of `useCvAgentTools.ts`), and `src/screens/cv/` only to import them.
- `src/shared/forest/`: `ImpactCards.tsx`, `EarlierRow.tsx`, `FooterCta.tsx` (`attributes`),
  `AGENTS.md`.
- `e2e/chat.spec.ts`, `e2e/agent.spec.ts` (`/new` cases). The brief grants the Scaffold/Theme
  hot spots it needs (`src/app/**`, `src/shared/**`, `e2e/**`).

## Consequences

- Easier: a third page is one id, one knowledge source, one catalogue builder and one string set;
  `/` keeps its exact request, so nothing about it needs re-checking.
- Harder: three cached prefixes instead of one; each page's catalogue must stay in step with its
  screen's `data-agent-id`s (covered by test 7); the snapshot's `route` and `CHAT_PAGE_ROUTES`
  change if the URLs move.
- Revisit: per-page instruction text if the `/new` golden check (CV-45) shows the shared wording
  misleads the model; `cv.uk.json` (then `/`'s UK knowledge follows it by the same rule).

## Action items

1. [ ] CV-96 (backend), then CV-97 (frontend) on its branch, per the Build split.
2. [ ] Golden check of `/new` (EN, UK) with the real model and the measured prefix tokens, with CV-45.
