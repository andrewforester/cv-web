import type { CvPage } from '../../src/data/cvPage.js';
import cvPageJson from '../../src/data/cv/cvPage.json' with { type: 'json' };

/**
 * The one page (v4) as the server knows it: the same JSON the site renders (single source of
 * truth). Its knowledge, catalogue and snapshot checks are all built from it.
 */
export const CV_PAGE: CvPage = cvPageJson;
