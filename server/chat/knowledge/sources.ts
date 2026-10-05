import type { ChatPage } from '../../../src/data/chat/contract.js';
import { CvKnowledgeSource } from './CvKnowledgeSource.js';
import { CvPageKnowledgeSource } from './CvPageKnowledgeSource.js';
import type { KnowledgeSource } from './KnowledgeSource.js';
import { ProfileKnowledgeSource } from './ProfileKnowledgeSource.js';

/**
 * The knowledge registry per page, in prompt order: the chat knows only the page it is on
 * (ADR-0004). Adding a source = one line here.
 */
export const KNOWLEDGE_SOURCES_BY_PAGE: Readonly<Record<ChatPage, readonly KnowledgeSource[]>> = {
  cv: [new CvKnowledgeSource()],
  profile: [new ProfileKnowledgeSource()],
};

/** The one page's knowledge (v4, ADR-0006): one English source, so one cached prefix. */
export const CV_PAGE_KNOWLEDGE_SOURCES: readonly KnowledgeSource[] = [new CvPageKnowledgeSource()];
