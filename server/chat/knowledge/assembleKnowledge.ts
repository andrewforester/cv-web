import type { KnowledgeDocument, KnowledgeSource } from './KnowledgeSource.js';

/** Above this estimate the prompt gets slow and costly; time to revisit RAG (SYSTEM_DESIGN §5). */
export const KNOWLEDGE_WARN_TOKENS = 50_000;
const CHARS_PER_TOKEN = 3.5;

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function wrap(documents: KnowledgeDocument[]): string {
  const parts = documents.map(
    (doc) =>
      `<document id="${escapeAttribute(doc.id)}" title="${escapeAttribute(doc.title)}">\n` +
      `${doc.text}\n</document>`,
  );
  return `<knowledge>\n${parts.join('\n')}\n</knowledge>`;
}

export type CvPageKnowledgeLoader = () => Promise<string>;

/**
 * The one page's knowledge: all sources, in registry order, in one `<knowledge>` element. English,
 * so it is loaded once and memoized for the life of the instance: every request gets the same
 * text, whatever language the visitor writes in (prompt caching). A failed load is retried next
 * time.
 */
export function createCvPageKnowledgeLoader(
  sources: readonly KnowledgeSource[],
  warn: (message: string) => void = console.warn,
): CvPageKnowledgeLoader {
  let cached: Promise<string> | undefined;
  return () => {
    if (cached) return cached;
    const loading = Promise.all(sources.map((source) => source.load())).then((lists) => {
      const text = wrap(lists.flat());
      const tokens = Math.round(text.length / CHARS_PER_TOKEN);
      if (tokens > KNOWLEDGE_WARN_TOKENS) {
        warn(`chat knowledge is ~${tokens} tokens (> ${KNOWLEDGE_WARN_TOKENS})`);
      }
      return text;
    });
    loading.catch(() => {
      cached = undefined;
    });
    cached = loading;
    return loading;
  };
}
