# agent

Why it exists: the browser side of the AI page agent (`docs/chat/AGENT.md`, ADR-0002). When a
visitor asks the chat to "show the apps" or "switch to Ukrainian", the model asks for a page tool
and this folder runs it on the page, safely: only known tools, only valid targets, and a visitor's
confirmation before anything that leaves the page (opening a contact).

Place in the architecture: a registry between the chat and the screens. The tool catalogue is
the page's (ADR-0004): the app shell says which page is on screen, and the catalogue comes from
the data layer (`src/data/chat/agentTools.ts`), built from the CV on `/` or from the profile on
`/new`, so the model can only name that page's sections and items. Screens register handlers for
the tools they can perform while they are mounted (the CV and profile screens: scroll, highlight,
contacts; the app shell: language); the chat (`src/screens/chat/`) executes the model's calls
through it and provides the confirmation UI. It holds no page content of its own and has no UI.

Guarantees: executing a call never throws; every outcome is a typed result the model can read
(unknown tool, not available right now, invalid input, declined by the visitor, failed).

Stub: the WebMCP export (exposing the same tools to browser agents) exists as a type and adapter
but is not wired to `navigator`.
