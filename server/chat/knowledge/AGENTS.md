# server/chat/knowledge

Why it exists: defines what the chat model knows about Andrew: exactly what the CV page shows,
nothing else. That is what keeps answers grounded and stops the model from inventing facts.

Place in the architecture: the chat pipeline asks it for the knowledge of a locale and places it
in the system prompt (`../prompt/`). Its source today is the same CV JSON the site renders
(`src/data/mock/`), so the page and the chat can never disagree; Ukrainian falls back to English
like the site does. Knowledge is a list of sources, so new material (e.g. Markdown notes) is one
more source, not a new pipeline.

Rules and limits:
- The rendered text must be deterministic (same bytes for the same CV): prompt caching, and so
  the cost per conversation, depends on it.
- Everything goes into every request (full context, no RAG). A warning fires past ~50k tokens:
  that is the point to reconsider RAG (`docs/chat/SYSTEM_DESIGN.md`).
- When the CV-editing backend arrives, only the CV source's loading changes.
