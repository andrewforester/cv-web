# ShowCaseButton

Why it exists: visitors start the Retro Rebuild show (the page turns into a broken 2001 site and
an agent fixes it live, ADR-0003) from a small "▶ Show case" pill at the end of the page's meta bar
(docs/design/v3/SPEC.md → Orchestrator decisions 7). The app shell renders it and hands it to the
page, so it lives here rather than in a screen.

Place in the architecture: a stateless component below the shell: `className` and an `onClick`
callback in, the label from the shared `common` strings, the look from the v3 tokens. The shell
shows it only while the page has a scenario, on desktop viewports (`src/app/useShowCaseAvailable`).
Test id `show-case` (`testIds.ts`) is what e2e and the shell's tests find it by.

Focus ring: the page's `--focus-ring` / `--focus-ring-offset` tokens.
