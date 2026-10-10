# shared

Why it exists: UI pieces used by more than one screen or by the app shell, so they exist once and
look the same everywhere. Today: `ShowCaseButton/` (the meta bar pill that starts the show, rendered
by the app shell), `agentTarget/` (the page agent's target marking and page actions) and `chat/`,
the stateless pieces of the AI chat shared by the site's chat and the show's agent chat.
`useMediaQuery` is a viewport-query hook.

Place in the architecture: stateless components below the screens: props in (the first optional
one is `className`), callbacks out, texts via `useStrings` or props, styles via tokens only. The
app shell or a screen wires them to state.

Rules: owner is Theme. A component starts in its screen folder and moves here in its own PR once a
second screen needs it. One folder per component (or per family, like `chat/`) with its styles,
tests and test ids.
