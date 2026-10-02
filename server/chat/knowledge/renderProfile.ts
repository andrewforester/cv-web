import type { EarlierJob, Job, Profile, ProfileApp } from '../../../src/data/profile.js';

/** English names of the contact rows (structure for the model; the values stay as written). */
const CONTACT_NAMES: Record<string, string> = { email: 'Email', phone: 'Phone' };

function job(entry: Job): string[] {
  return [
    `### ${entry.role}, ${entry.company}, ${entry.period}`,
    ...entry.points.map((point) => `- ${point}`),
  ];
}

function earlierJob(entry: EarlierJob): string {
  return `- ${entry.role}, ${entry.company}, ${entry.period}`;
}

function app(entry: ProfileApp): string {
  return `- ${entry.name}: ${entry.meta}`;
}

/**
 * The `/new` profile as compact Markdown for the model, like `renderCv`: English headings,
 * content verbatim in the profile's locale, everything the page shows as text. Dropped: image
 * refs, in-page links (the "Live AI CV" row opens this chat, it is not a contact) and the footer
 * call to action (its email is already a contact). Deterministic, which prompt caching needs.
 */
export function renderProfile(profile: Profile): string {
  const { meta, loop, education, about } = profile;
  const contacts = profile.contacts.filter((contact) => !contact.href.startsWith('#'));
  const lines = [
    `# ${profile.name}`,
    profile.headline.map((part) => part.text).join(''),
    profile.subtitle,
    `${meta.location} · ${meta.workMode} · ${meta.status}`,
    '',
    profile.summary,
    '',
    '## Contacts',
    ...contacts.map((contact) => `- ${CONTACT_NAMES[contact.id] ?? contact.id}: ${contact.label}`),
    '',
    '## Selected impact',
    ...profile.impact.map((card) => `- ${card.value}: ${card.text}`),
    '',
    '## How I build with agents',
    loop.lead,
    ...loop.steps.map((step, index) => `${index + 1}. ${step.text}`),
    loop.footnote,
    '',
    '## Experience',
    ...profile.jobs.flatMap(job),
    '',
    '## Earlier',
    ...profile.earlier.map(earlierJob),
    '',
    '## Apps',
    ...profile.apps.map(app),
    '',
    '## Skills',
    ...profile.skills.map((group) => `- ${group.title}: ${group.items}`),
    '',
    '## Education',
    `${education.title}, ${education.place}, ${education.period}`,
    education.text,
    '',
    '## About',
    ...about.books.map((book) => `- ${book.title} by ${book.author}`),
    ...about.text,
  ];
  return lines.join('\n');
}
