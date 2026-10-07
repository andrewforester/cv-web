# ShowCaseLink

Why it exists: with the top Show case button hidden (CV-144), visitors still need a quiet way to
start the Retro Rebuild show (ADR-0003). This is an inconspicuous text link, "Show old version with
some fun", at the end of the page footer's copyright line. The app shell renders it and hands it to
the page's `copyrightEnd` slot, so it lives here rather than in a screen.

Place in the architecture: a stateless component below the shell: `className` and an `onClick`
callback in, the label from the shared `common` strings, the look from the v3 tokens (the
copyright's type, muted ink). The shell shows it only while the page has a scenario, on desktop
viewports (`src/app/useShowCaseAvailable`). Test id `show-case-link` (`testIds.ts`).
