import { StaticCvRepository } from '../index';
import type { CvPage } from '../index';
import { RETRO_FINALE_FALLBACK, RETRO_STEPS } from './scenario';

// The show's copy names things on the CV page (the headline, the contact buttons, the book
// covers...). Each phrase it names is listed here with what the data must hold for it to be true;
// a phrase that left the copy fails too, so the list can't go stale.
interface NamedContent {
  phrase: string;
  needs: string;
  holds: (page: CvPage) => boolean;
}

const hasContact = (page: CvPage, label: string) =>
  page.contacts.some((contact) => contact.label === label || contact.id === label.toLowerCase());

const NAMED_CONTENT: readonly NamedContent[] = [
  {
    phrase: 'Senior Software Product Engineer',
    needs: 'a headline whose parts read "Senior Software Product Engineer"',
    holds: (page) =>
      page.headline.map((part) => part.text).join('') === 'Senior Software Product Engineer',
  },
  { phrase: 'Email me', needs: 'an email contact', holds: (page) => hasContact(page, 'email') },
  {
    phrase: 'WhatsApp',
    needs: 'a WhatsApp contact',
    holds: (page) => hasContact(page, 'WhatsApp'),
  },
  {
    phrase: 'LinkedIn',
    needs: 'a LinkedIn contact',
    holds: (page) => hasContact(page, 'LinkedIn'),
  },
  {
    phrase: 'book covers',
    needs: 'non-empty about.books',
    holds: (page) => page.about.books.length > 0,
  },
  {
    phrase: 'project icons',
    needs: 'a job with projects',
    holds: (page) => page.jobs.some((job) => (job.projects?.length ?? 0) > 0),
  },
  {
    phrase: 'app icons',
    needs: 'a job with projects',
    holds: (page) => page.jobs.some((job) => (job.projects?.length ?? 0) > 0),
  },
  { phrase: 'photo', needs: 'a photo', holds: (page) => page.photo !== '' },
];

const copy = [
  ...RETRO_STEPS.flatMap((step) => [step.title, step.intent, step.fallback]),
  RETRO_FINALE_FALLBACK,
].join('\n');

let page: CvPage;
beforeAll(async () => {
  page = await new StaticCvRepository().getCvPage();
});

describe('Show case copy vs the CV data', () => {
  it.each(NAMED_CONTENT.map((item) => [item.phrase, item] as const))(
    'the copy still names "%s"',
    (phrase) => {
      expect(
        copy,
        `"${phrase}" is no longer in the show's copy: drop it from NAMED_CONTENT`,
      ).toContain(phrase);
    },
  );

  it.each(NAMED_CONTENT.map((item) => [item.phrase, item] as const))(
    'the CV data has what "%s" names',
    (phrase, item) => {
      expect(
        item.holds(page),
        `The show's copy names "${phrase}" but the CV data lacks it (needs ${item.needs})`,
      ).toBe(true);
    },
  );
});
