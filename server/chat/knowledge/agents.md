# server/chat/knowledge

What the chat model knows about Andrew: exactly what the CV page shows, nothing else.

- `KnowledgeSource.ts`: `KnowledgeSource { id; load(locale) → KnowledgeDocument[] }`,
  `KnowledgeDocument { id, title, text (Markdown) }`. Async so a backend can serve it later.
- `CvKnowledgeSource.ts`: imports the same `src/data/mock/cv.<locale>.json` the site renders
  (single source of truth; `uk` falls back to `en` like `StaticCvRepository`). When the CV
  editing backend arrives, only `load` changes.
- `renderCv.ts`: `Cv` → compact, deterministic Markdown in page order (name, headline, contacts,
  summary, technologies, latest experience, apps, education, books, interests, previous
  experience). Rich text flattened, image refs dropped. Deterministic bytes keep caching working.
- `assembleKnowledge.ts`: `createKnowledgeLoader(sources)` → `(locale) → '<knowledge>…'` with
  one `<document id title>` per document in registry order; memoized per locale per instance;
  warns above ~50k tokens (time to consider RAG, see SYSTEM_DESIGN §5).
- `sources.ts`: the registry. Adding a source (e.g. `MarkdownKnowledgeSource` over
  `knowledge/<locale>/*.md`) = one line here + `includeFiles` in `vercel.json`.
