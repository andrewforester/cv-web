import { CvPageKnowledgeSource } from './CvPageKnowledgeSource.js';
import type { KnowledgeSource } from './KnowledgeSource.js';

/**
 * The knowledge registry, in prompt order (ADR-0006): one English source, so one cached prefix.
 * Adding a source = one line here.
 */
export const CV_PAGE_KNOWLEDGE_SOURCES: readonly KnowledgeSource[] = [new CvPageKnowledgeSource()];
