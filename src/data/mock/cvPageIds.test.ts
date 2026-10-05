import { CV_CONTACT_CHANNELS } from '../chat/contract';
import type { CvPage } from '../cvPage';
import { StaticCvRepository } from './StaticCvRepository';

/** Item ids per list, in data order. */
function idsOf(page: CvPage) {
  const ids = (list: { id: string }[]) => list.map((item) => item.id);
  return {
    stats: ids(page.stats),
    contacts: ids(page.contacts),
    craft: ids(page.craft),
    loop: ids(page.loop.steps),
    impact: ids(page.impact),
    jobs: ids(page.jobs),
    projects: ids(page.jobs.flatMap((job) => job.projects ?? [])),
    skills: ids(page.skills),
    books: ids(page.about.books),
  };
}

describe('CvPage item ids', () => {
  const load = () => new StaticCvRepository().getCvPage();

  it('are lowercase slugs, unique per list', async () => {
    for (const [list, ids] of Object.entries(idsOf(await load()))) {
      expect(ids.length, list).toBeGreaterThan(0);
      for (const id of ids) expect(id, list).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(new Set(ids).size, list).toBe(ids.length);
    }
  });

  it('contacts are the chat contract channels, in order', async () => {
    expect(idsOf(await load()).contacts).toEqual([...CV_CONTACT_CHANNELS]);
  });

  it('match ADR-0006 → Decision 1', async () => {
    const ids = idsOf(await load());
    expect(ids.stats).toEqual(['years', 'users', 'platforms', 'ai']);
    expect(ids.jobs).toEqual([
      'ai-cv',
      'transcenda',
      'wisehouse',
      'attendify',
      'rosfines',
      'smartling',
      'rokkit',
      'ivi',
      'samsung',
    ]);
    expect(ids.projects).toEqual(['spoton', 'cync', 'august-home']);
    expect(ids.books).toEqual(['the-goal', 'a-pattern-language', 'antifragile', 'siddhartha']);
  });
});
