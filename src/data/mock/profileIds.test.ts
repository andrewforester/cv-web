import { LOCALES } from '../../i18n/locale';
import type { Profile } from '../profile';
import { StaticCvRepository } from './StaticCvRepository';

/** Item ids per kind, in data order. */
function idsOf(profile: Profile) {
  const ids = (list: { id: string }[]) => list.map((item) => item.id);
  return {
    contacts: ids(profile.contacts),
    impact: ids(profile.impact),
    loop: ids(profile.loop.steps),
    jobs: ids(profile.jobs),
    earlier: ids(profile.earlier),
    apps: ids(profile.apps),
    skills: ids(profile.skills),
    books: ids(profile.about.books),
  };
}

describe('Profile item ids', () => {
  const repository = new StaticCvRepository();

  it('are lowercase slugs, unique per kind', async () => {
    for (const [kind, ids] of Object.entries(idsOf(await repository.getProfile('en')))) {
      expect(ids.length, kind).toBeGreaterThan(0);
      for (const id of ids) expect(id, kind).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(new Set(ids).size, kind).toBe(ids.length);
    }
  });

  it('are the same in every locale', async () => {
    const expected = idsOf(await repository.getProfile('en'));
    for (const locale of LOCALES) {
      expect(idsOf(await repository.getProfile(locale)), locale).toEqual(expected);
    }
  });

  it('every locale has its own translation', async () => {
    const en = await repository.getProfile('en');
    const uk = await repository.getProfile('uk');
    expect(uk.summary).not.toBe(en.summary);
    expect(uk.loop.lead).not.toBe(en.loop.lead);
  });
});
