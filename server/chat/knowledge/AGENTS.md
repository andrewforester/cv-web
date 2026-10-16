# server/chat/knowledge

Why it exists: defines what the chat model knows about Andrew: exactly what the one CV page shows,
nothing else. That is what keeps answers grounded and stops the model from inventing facts.

Place in the architecture: the chat pipeline (v4) and the show's replies (v3, `../show/`) ask it
for the knowledge and place it in the system prompt (`../prompt/`). Its source today is the same
JSON the site renders (`src/data/cv/cvPage.json`, read only through `../cvPageData.ts`, ADR-0007), rendered as
`<document id="cv" title="CV">`, so the page and its chat can never disagree. The page is English,
so the loader takes no arguments and memoizes one text: one cached prefix for every request,
whatever language the visitor writes in. New material (e.g. Markdown notes) is one more source in
`sources.ts`, not a new pipeline.

Rules and limits:
- The rendered text must be deterministic (same bytes for the same data): prompt caching, and so
  the cost per conversation, depends on it.
- Everything goes into every request (full context, no RAG). A warning fires past ~50k tokens:
  that is the point to reconsider RAG (`docs/chat/SYSTEM_DESIGN.md`).
- When the CV-editing backend arrives, only the sources' loading changes.
