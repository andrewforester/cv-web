# shared/chat

Why it exists: the site's AI chat and the agent chat in the retro show (the "agent fixes the page
live" scene) must look like the same product. The stateless pieces of the chat live here once, so
when the site's chat is restyled the show follows, and the show doesn't import the chat screen
(a screen may not import another screen).

What is here: the card frame (`ChatCard`: the v3 dark panel, the loop panel's colours) and its
header (`ChatCardHeader`: badge, title, subtitle, one trailing action: collapse on the site,
minimise in the show), message bubbles (`MessageRow`, `NoticeRow`), the waiting and streaming cues
(`TypingIndicator`, `StreamingCaret`), `SendButton` (Send, or Stop while busy), `OfflineNotice`,
`ChatBadge` (the ✦ on the gradient: the header's badge and the site's "Talk to my AI" pill),
`ChatIcon` with its `assets/` (the voice mode's mic, mute, end, offline, alert and timer icons
included: the chat's call divider uses the mic too; `collapse`, the one control that folds the
site's chat panel), and `chat.module.css` (caption, screen-reader-only, icon and
secondary buttons).

Place in the architecture: stateless components below the screens: props in, callbacks out. They
hold no chat state and no strings: each screen passes its own texts (author prefixes, button
labels, offline text) from its own strings namespace. Tokens are in the theme: the v3 ones
(`--color-*`, `--gradient-*`, `--font-*`, `--radius-*`) and `--chat-*` for the chat-only values.
Used by `src/screens/chat/` (which binds its strings in thin wrappers) and the retro show's agent
chat (`src/screens/retro/`).

Limits: the composer and the launcher are not shared; the show builds its own composer from
`SendButton` and the shared CSS. Test ids of the shared pieces are in `testIds.ts`.
