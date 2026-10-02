# agentTarget

Why it exists: the AI chat's page agent (ADR-0002, ADR-0004) scrolls to and highlights parts of
whichever page the visitor is on, `/` (the CV) or `/new` (the profile). Both screens mark their
sections and items the same way and run the same page actions, so that lives here once instead of
in each screen.

Domain terms: a **target** is an element with `data-agent-id="<kind>:<id>"` (`section:apps`,
`experience:transcenda`); ids come from the page's data and are the same in every locale, so one
command works in both languages. The **highlight** is a short fading outline on the target the
agent points at (`data-agent-highlighted`), owned by the screen's state holder. The **section in
view** is the page section at the reading line (a third of the way down the viewport), read from
the page when the visitor sends a question; it and the highlight go into the chat's page snapshot.

Place in the architecture: below the screens, above `src/data/chat` (target id types). Screens
compute target attributes and pass them to the Forest components as `attributes`; their agent
tool hooks (`useCvAgentTools`, `useProfileAgentTools`) use the scroll and open-link actions and
offer the page's view to the agent registry; their state holders own the highlight. The highlight look comes from theme tokens
(`--agent-highlight-*`, `--agent-scroll-margin-top`).

Limits: scrolling doesn't update the URL hash; the highlight colour is the theme's.
