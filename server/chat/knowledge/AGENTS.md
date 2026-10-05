# server/chat/knowledge

Why it exists: defines what the chat model knows about Andrew: exactly what the page the chat is
on shows, nothing else (`/` the CV, `/new` the profile; never the other page). That is what keeps
answers grounded and stops the model from inventing facts.

Place in the architecture: the chat pipeline asks it for the knowledge of a page and locale and
places it in the system prompt (`../prompt/`). Its sources today are the same JSON the site
renders (`src/data/mock/`), so a page and its chat can never disagree. Locale rule: the knowledge
is what the page shows in that locale, so `/` stays English for `uk` (no UK CV yet, like the site)
and `/new` uses `profile.uk.json`. Each page has a list of sources, so new material (e.g. Markdown
notes) is one more source, not a new pipeline. The v4 chat (the one page v3, ADR-0006) has one
English source, `cvPage.json` rendered as `<document id="cv" title="CV">`, behind a loader that
takes no arguments: one text, so one cached prefix. The show's replies move to it in the Show
task; the per-page sources go in the Cleanup task.

Rules and limits:
- The rendered text must be deterministic (same bytes for the same data): prompt caching, and so
  the cost per conversation, depends on it.
- Everything goes into every request (full context, no RAG). A warning fires past ~50k tokens:
  that is the point to reconsider RAG (`docs/chat/SYSTEM_DESIGN.md`).
- When the CV-editing backend arrives, only the sources' loading changes.
