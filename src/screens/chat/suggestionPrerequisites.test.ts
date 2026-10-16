import { StaticCvRepository } from '../../data';
import type { CvPage } from '../../data';
import { SUGGESTION_PREREQUISITES } from './suggestionPrerequisites';
import { chatStrings } from './strings';

// The starter questions still have content behind them: editing the CV data must not leave a
// question the chat can't answer.
const suggestionKeys = Object.keys(chatStrings.en).filter((key) => /^suggestion\d+$/.test(key));
const prerequisites: Record<
  string,
  (typeof SUGGESTION_PREREQUISITES)[keyof typeof SUGGESTION_PREREQUISITES]
> = SUGGESTION_PREREQUISITES;

let page: CvPage;
beforeAll(async () => {
  page = await new StaticCvRepository().getCvPage();
});

describe('chat starter questions vs the CV data', () => {
  it('has a prerequisite for every starter question, and no stale ones', () => {
    expect(suggestionKeys.length).toBeGreaterThan(0);
    expect(Object.keys(prerequisites).sort()).toEqual([...suggestionKeys].sort());
  });

  it.each(suggestionKeys)('%s has the data it needs', (key) => {
    const prerequisite = prerequisites[key];
    const question = (chatStrings.en as Record<string, string>)[key];
    expect(
      prerequisite?.holds(page),
      `Starter question "${question}" (${key}) needs ${prerequisite?.needs}, but the CV data has none`,
    ).toBe(true);
  });
});
