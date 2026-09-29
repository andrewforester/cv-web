# cv

The CV page (the site's root page): Andrew Panasiuk's CV as one scrolling page, built from
`docs/design/cv/SPEC.md` (render references `page1.png`–`page3.png`). Part 1 (#7): sections 1–4;
part 2 (#8): sections 5–8.

- `useCvState()` loads `Cv` via `useCvRepository().getCv(locale)` → `CvUiState`
  (`loading` | `error` | `ready {cv}`); `CvRoute` glues it to the stateless `CvScreen`.
- `CvScreen` composes sections in SPEC order: `HeaderSection` (name, headline, tagline, photo,
  `ContactList` with mailto/tel/WhatsApp/Telegram links), `SummarySection`, `TechnologiesSection`
  (3 flex columns by `card.column`; under 720 px CSS columns reflow them to 2, under 600 px to 1)
  with `TechnologyCardView` (variants `default`, `highlighted` = yellow border + star, `ai` =
  masked gradient border), `ExperienceSection` "Latest relevant experience", `AppsSection`
  (`AppCardView` = name, publisher, icon, `AppStat` blocks: rating + star + reviews only when the
  app has a rating, a divider, downloads; one card per row under 600 px), `EducationSection`,
  `AboutSection` (favourite books as `BookView` covers, 2 per row under 600 px; interests),
  `ExperienceSection` "Previous Experience" (lazy logos).
- Shared inside the screen: `SectionTitle`, `ExperienceSection` → `ExperienceList` (30 px stack)
  → `ExperienceEntry` (logo, company + "remotely", role, period, bullets), `RichTextLine`
  (renders `RichText` spans; emphasis `medium` / `boldItalic`).
- Images: data holds `ImageRef` ids; `images.ts` maps ids to bundled files in `assets/`
  (`cv_*`, resized to ≤ 2× display size from `docs/design/cv/assets/`; the Rokkit logo is cropped
  to its triangle mark as in the render) and passes URLs through.
- Texts: UI labels in `strings.ts` (`cv` namespace, English only; `uk` falls back to `en`); all CV
  content comes from `src/data`.
- Test ids: `testIds.ts`. Tests: `CvRoute.test.tsx` (mock data: name, contacts, 9 cards, Transcenda;
  3 apps with Savant unrated, education, 4 books, interests, 7 previous entries with 3 "remotely";
  error state), `RichTextLine.test.tsx`.

Stubs: image sizes (`--cv-photo-size`, `--cv-logo-size`, `--cv-icon-size`,
`--cv-rating-star-size`, `--cv-book-width/height`) are screen-local custom properties in
`CvScreen.module.css`; emphasis weights reuse `--font-subsection-weight` / `--font-name-weight`.
Both `TODO(theme)`: move to theme tokens if the theme adds them.

Page agent (GRA-34, `docs/chat/AGENT.md`): every section and item is an agent target.
- `agentTargetProps(kind, id, highlightedId)` (`agentTarget.ts`) is spread on the element: gives
  `data-agent-id="<kind>:<id>"` (sections: `section:<AgentSectionId>`; items by their CV `id`;
  contacts `contact:<channel>`) and `data-agent-highlighted` while it is the highlighted one.
  `agentTarget.css` (global, tokens only) sets `scroll-margin-top` and the fading outline.
- `CvUiState.ready.highlightedId` is set by `useCvState().highlight(id)` and clears after 3 s;
  components only render it (no class toggling from executors).
- `useCvAgentTools(cv, highlight)` (called by `CvRoute`, only while the CV is ready) registers
  `scrollToSection`, `highlightElement` (both find the element by `data-agent-id`; missing →
  `unknown_target`; smooth scroll, instant under reduced motion) and `openContact` (link from
  `contactLinks.ts`; the visitor's confirmation is done by the registry's confirm callback, which
  the chat sets). Test: `CvRoute.agent.test.tsx`.
Not done: URL hash update on `scrollToSection` (elements have no `id`).
