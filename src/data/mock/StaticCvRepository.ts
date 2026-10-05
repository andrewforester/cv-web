import type { CvPage } from '../cvPage';
import type { CvPageRepository } from '../CvPageRepository';
import cvPage from './cvPage.json';

const CV_PAGE: CvPage = cvPage;

/** Mock repository over the bundled JSON of the one page (English). */
export class StaticCvRepository implements CvPageRepository {
  async getCvPage(): Promise<CvPage> {
    return CV_PAGE;
  }
}
