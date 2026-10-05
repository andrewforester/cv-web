# agent

Why it exists: the browser side of the AI page agent (`docs/chat/AGENT.md`, ADR-0002). When a
visitor asks the chat to "show his selected impact" or "highlight Transcenda", the model asks for
a page tool and this folder runs it on the page, safely: only known tools, only valid targets, and
a visitor's confirmation before anything that leaves the page (opening a contact).

Place in the architecture: a registry between the chat and the screens. The site has one page
(ADR-0006), so there is one catalogue: the data layer builds it (`src/data/chat/agentTools.ts`)
from `CvPage`, so the model can only name the page's sections and items. The screen registers
handlers for the tools it can perform while it is mounted (scroll, highlight, contacts); the chat
(`src/screens/chat/`) executes the model's calls through it and provides the confirmation UI. The
mounted screen also registers its **view** (the section in view and the highlighted target),
which the chat reads into the page snapshot of each question, so the model knows what the visitor
is looking at. It holds no page content of its own and has no UI.

Guarantees: executing a call never throws; every outcome is a typed result the model can read
(unknown tool, not available right now, invalid input, declined by the visitor, failed).

Limits: until the Cleanup task deletes the old CV and profile screens, a view may still name their
sections (the chat narrows it to the page's). Stub: the WebMCP export (exposing the same tools to
browser agents) exists as a type and adapter but is not wired to `navigator`.
