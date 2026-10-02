# server/chat/knowledge

Why it exists: defines what the chat model knows about Andrew: exactly what the page the chat is
on shows, nothing else (`/` the CV, `/new` the profile; never the other page). That is what keeps
answers grounded and stops the model from inventing facts.

Place in the architecture: the chat pipeline asks it for the knowledge of a page and locale and
places it in the system prompt (`../prompt/`). Its sources today are the same JSON the site
renders (`src/data/mock/`), so a page and its chat can never disagree. Locale rule: the knowledge
is what the page shows in that locale, so `/` stays English for `uk` (no UK CV yet, like the site)
and `/new` uses `profile.uk.json`. Each page has a list of sources, so new material (e.g. Markdown
notes) is one more source, not a new pipeline.

Rules and limits:
- The rendered text must be deterministic (same bytes for the same data): prompt caching, and so
  the cost per conversation, depends on it.
- Everything goes into every request (full context, no RAG). A warning fires past ~50k tokens:
  that is the point to reconsider RAG (`docs/chat/SYSTEM_DESIGN.md`).
- When the CV-editing backend arrives, only the sources' loading changes.
