import type { CvJob, CvPage, CvProject } from '../../../src/data/cvPage.js';

/** English names of the contact channels (structure for the model; the values stay as written). */
const CONTACT_NAMES: Record<string, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
};

function project(entry: CvProject): string[] {
  return [
    `#### ${entry.name}, ${entry.domain}, ${entry.meta}`,
    entry.about,
    ...entry.points.map((point) => `- ${point}`),
  ];
}

function job(entry: CvJob): string[] {
  return [
    `### ${entry.role}, ${entry.company}, ${entry.period}`,
    ...(entry.about ? [entry.tag ? `${entry.tag}: ${entry.about}` : entry.about] : []),
    ...(entry.meta ? [`Store: ${entry.meta}`] : []),
    ...entry.points.map((point) => `- ${point}`),
    ...(entry.projects ?? []).flatMap(project),
  ];
}

/**
 * The one page as compact Markdown for the model: English headings and everything the page shows
 * as text, in page order. Dropped: image refs and the footer call to
 * action (its email is a contact). Deterministic, which prompt caching needs.
 */
export function renderCvPage(page: CvPage): string {
  const { meta, loop, education, about } = page;
  const lines = [
    `# ${page.name}`,
    page.headline.map((part) => part.text).join(''),
    page.tagline,
    `${meta.location} · ${meta.workMode} · ${meta.status}`,
    '',
    ...page.summary,
    '',
    '## Key facts',
    ...page.stats.map((stat) => `- ${stat.value}: ${stat.label}`),
    '',
    '## Contacts',
    ...page.contacts.map(
      (contact) =>
        `- ${CONTACT_NAMES[contact.id] ?? contact.id}: ${contact.href.replace(/^mailto:/, '')}`,
    ),
    '',
    '## Code craft × agentic process',
    ...page.craft.flatMap((card) => [`### ${card.label}: ${card.title}`, card.text]),
    '',
    '## How I build with agents',
    loop.lead,
    ...loop.steps.map((step, index) => `${index + 1}. ${step.text}`),
    loop.footnote,
    '',
    '## Selected impact',
    ...page.impact.map((card) => `- ${card.value}: ${card.text}`),
    '',
    '## Experience',
    ...page.jobs.flatMap(job),
    '',
    '## Skills',
    ...page.skills.map((group) => `- ${group.title}: ${group.items}`),
    '',
    '## Education',
    `${education.title}, ${education.place}, ${education.period}`,
    education.text,
    '',
    '## About me',
    ...about.books.map((book) => `- ${book.title} by ${book.author}`),
    ...about.lines.map((line) => `${line.label} ${line.text}`),
  ];
  return lines.join('\n');
}
