import type { CvPage } from '../../data';
import type { chatStrings } from './strings';

/** The `suggestionN` keys of the chat strings: the starter questions. */
export type SuggestionKey = Extract<keyof (typeof chatStrings)['en'], `suggestion${number}`>;

/** What a starter question needs from the CV data to have an answer. */
export interface SuggestionPrerequisite {
  /** Said in the failure message when `holds` is false. */
  needs: string;
  holds: (page: CvPage) => boolean;
}

const mentionsAgents = (text: string) => /\b(AI|agent|agents|agentic)\b/i.test(text);

/**
 * One entry per starter question (`strings.ts`, listed in `useChatState.ts`): the data that makes
 * it answerable. `suggestionPrerequisites.test.ts` runs them on the CV data and fails for a
 * question without an entry, so a new question gets its prerequisite here.
 */
export const SUGGESTION_PREREQUISITES: Record<SuggestionKey, SuggestionPrerequisite> = {
  suggestion1: {
    needs: 'loop.steps (the agent loop) and AI / agent wording in the tagline, stats or craft',
    holds: (page) =>
      page.loop.steps.length > 0 &&
      (mentionsAgents(page.tagline) ||
        page.stats.some((stat) => mentionsAgents(stat.value)) ||
        page.craft.some((card) => mentionsAgents(`${card.label} ${card.title} ${card.text}`))),
  },
  suggestion2: {
    needs: 'a non-empty impact list',
    holds: (page) => page.impact.length > 0,
  },
  suggestion3: {
    needs: 'at least one job with projects',
    holds: (page) => page.jobs.some((job) => (job.projects?.length ?? 0) > 0),
  },
  suggestion4: {
    needs: 'an availability status in meta.status',
    holds: (page) => page.meta.status.trim() !== '',
  },
};
