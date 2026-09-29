import type { ChatLocale } from '../../../src/data/chat/contract.js';

/** One piece of knowledge the model may answer from. `text` is Markdown. */
export interface KnowledgeDocument {
  id: string;
  title: string;
  text: string;
}

/** A provider of knowledge documents; async so a backend can serve them later. */
export interface KnowledgeSource {
  readonly id: string;
  load(locale: ChatLocale): Promise<KnowledgeDocument[]>;
}
