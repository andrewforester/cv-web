# shared

Why it exists: UI pieces used by more than one screen or by the app shell, so they exist once and
look the same everywhere. Today: the EN / UA language switcher in the header and `chat/`, the stateless pieces of the AI
chat shared by the site's chat and the show's agent chat.

Place in the architecture: stateless components below the screens: props in (the first optional
one is `className`), callbacks out, texts via `useStrings`, styles via tokens only. The app shell
or a screen wires them to state.

Rules: owner is Theme. A component starts in its screen folder and moves here in its own PR once a
second screen needs it. One folder per component with its styles, test and test ids.
