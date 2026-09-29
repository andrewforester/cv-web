import { LOCALES } from '../../i18n/locale';
import type { Cv } from '../models';
import { StaticCvRepository } from './StaticCvRepository';

/** Item ids per kind, in data order. */
function idsOf(cv: Cv) {
  const ids = (list: { id: string }[]) => list.map((item) => item.id);
  return {
    technologies: ids(cv.technologies),
    experience: ids([...cv.latestExperience, ...cv.previousExperience]),
    apps: ids(cv.apps),
    books: ids(cv.books),
  };
}

describe('CV item ids', () => {
  const repository = new StaticCvRepository();

  it('are lowercase slugs, unique per kind', async () => {
    for (const [kind, ids] of Object.entries(idsOf(await repository.getCv('en')))) {
      for (const id of ids) expect(id, kind).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(new Set(ids).size, kind).toBe(ids.length);
    }
  });

  it('are the same in every locale', async () => {
    const expected = idsOf(await repository.getCv('en'));
    for (const locale of LOCALES) {
      expect(idsOf(await repository.getCv(locale)), locale).toEqual(expected);
    }
  });
});
