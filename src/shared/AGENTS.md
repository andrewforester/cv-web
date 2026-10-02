# shared

Why it exists: UI pieces used by more than one screen or by the app shell, so they exist once and
look the same everywhere. Today: the EN / UA language switcher (in the meta bar on `/new`, in the
header on `/`) and `forest/`, the building blocks of the Forest look shared by both CV pages.

Place in the architecture: stateless components below the screens: props in (the first optional
one is `className`), callbacks out, texts via `useStrings` or props, styles via tokens only. The
app shell or a screen wires them to state.

Rules: owner is Theme. A component starts in its screen folder and moves here in its own PR once a
second screen needs it (`forest/` was built here up front: the design binds it to both pages).
One folder per component (or per family, like `forest/`) with its styles, tests and test ids.
