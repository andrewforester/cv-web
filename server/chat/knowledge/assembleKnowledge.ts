import { CHAT_PAGES, type ChatLocale, type ChatPage } from '../../../src/data/chat/contract.js';
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

export type KnowledgeLoader = (locale: ChatLocale) => Promise<string>;

/**
 * Loads all sources for a locale, in registry order, into one `<knowledge>` element. Memoized per
 * locale for the life of the instance (the text is identical per locale, for prompt caching).
 */
export function createKnowledgeLoader(
  sources: readonly KnowledgeSource[],
  warn: (message: string) => void = console.warn,
): KnowledgeLoader {
  const cache = new Map<ChatLocale, Promise<string>>();
  return (locale) => {
    const cached = cache.get(locale);
    if (cached) return cached;
    const loading = Promise.all(sources.map((source) => source.load(locale))).then((lists) => {
      const text = wrap(lists.flat());
      const tokens = Math.round(text.length / CHARS_PER_TOKEN);
      if (tokens > KNOWLEDGE_WARN_TOKENS) {
        warn(`chat knowledge for ${locale} is ~${tokens} tokens (> ${KNOWLEDGE_WARN_TOKENS})`);
      }
      return text;
    });
    loading.catch(() => cache.delete(locale));
    cache.set(locale, loading);
    return loading;
  };
}

export type PageKnowledgeLoader = (page: ChatPage, locale: ChatLocale) => Promise<string>;

/** One memoized loader per page (`createKnowledgeLoader`), picked by the request's page. */
export function createPageKnowledgeLoader(
  sourcesByPage: Readonly<Record<ChatPage, readonly KnowledgeSource[]>>,
  warn: (message: string) => void = console.warn,
): PageKnowledgeLoader {
  const loaders = Object.fromEntries(
    CHAT_PAGES.map((page) => [
      page,
      createKnowledgeLoader(sourcesByPage[page], (message) => warn(`${page}: ${message}`)),
    ]),
  ) as Record<ChatPage, KnowledgeLoader>;
  return (page, locale) => loaders[page](locale);
}

export type CvPageKnowledgeLoader = () => Promise<string>;

/**
 * The one page's knowledge (v4): English, so one memoized text for every request, whatever
 * language the visitor writes in.
 */
export function createCvPageKnowledgeLoader(
  sources: readonly KnowledgeSource[],
  warn: (message: string) => void = console.warn,
): CvPageKnowledgeLoader {
  const load = createKnowledgeLoader(sources, warn);
  return () => load('en');
}
