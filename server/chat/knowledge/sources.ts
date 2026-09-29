import { CvKnowledgeSource } from './CvKnowledgeSource.js';
import type { KnowledgeSource } from './KnowledgeSource.js';

/** The knowledge registry, in prompt order. Adding a source = one line here. */
export const KNOWLEDGE_SOURCES: readonly KnowledgeSource[] = [new CvKnowledgeSource()];
