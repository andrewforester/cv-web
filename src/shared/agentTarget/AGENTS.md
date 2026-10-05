# agentTarget

Why it exists: the AI chat's page agent (ADR-0002, ADR-0006) scrolls to and highlights parts of
the one CV page. Marking sections and items and running page actions are page-independent, so
they live here, apart from the screen's layout.

Domain terms: a **target** is an element with `data-agent-id="<kind>:<id>"` (`section:impact`,
`experience:transcenda`); ids come from the page's data and never change with the wording. The **highlight** is a short fading outline on the target the
agent points at (`data-agent-highlighted`), owned by the screen's state holder. The **section in
view** is the page section at the reading line (a quarter of the way down the viewport), read from
the page when the visitor sends a question; it and the highlight go into the chat's page snapshot.

Place in the architecture: below the screens, above `src/data/chat` (target id types). The
screen (`src/screens/home/`) computes target attributes for its components; its agent tool hook
(`useHomeAgentTools`) uses the scroll and open-link actions and offers the page's view to the
agent registry; its state holder owns the highlight. The highlight look comes from theme tokens
(`--agent-highlight-*`, `--agent-scroll-margin-top`).

Limits: scrolling doesn't update the URL hash; the highlight colour is the theme's.
