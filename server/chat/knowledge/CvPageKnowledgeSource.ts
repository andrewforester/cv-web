import { CV_PAGE } from '../cvPageData.js';
import type { KnowledgeDocument, KnowledgeSource } from './KnowledgeSource.js';
import { renderCvPage } from './renderCvPage.js';

/** The one page (v4), English only. A CV backend later changes only `load`. */
export class CvPageKnowledgeSource implements KnowledgeSource {
  readonly id = 'cv';

  async load(): Promise<KnowledgeDocument[]> {
    return [{ id: 'cv', title: 'CV', text: renderCvPage(CV_PAGE) }];
  }
}
