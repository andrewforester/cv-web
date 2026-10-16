import type { CvPage, CvPageRepository } from '../../data';

/** The page's data: chip labels and confirmations are built from it. */
export type ChatPageContent = CvPage;

/** Loads the page's data; `null` when it can't (labels then fall back to ids). */
export function loadPageContent(repository: CvPageRepository): Promise<ChatPageContent | null> {
  return repository.getCvPage().catch(() => null);
}
