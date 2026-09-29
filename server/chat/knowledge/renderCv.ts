import type { AppCard, Cv, ExperienceEntry, RichText } from '../../../src/data/models.js';

/** Rich text flattened to plain text (emphasis dropped). */
function plain(text: RichText): string {
  return text.map((span) => span.text).join('');
}

function experience(entry: ExperienceEntry): string[] {
  const place = entry.remote ? `${entry.company} (remote)` : entry.company;
  return [
    `### ${entry.role}, ${place}, ${entry.period}`,
    ...entry.bullets.map((bullet) => `- ${plain(bullet)}`),
  ];
}

function app(card: AppCard): string {
  const rating = card.rating
    ? `, rating ${card.rating}${card.reviews ? ` (${card.reviews} reviews)` : ''}`
    : '';
  return `- ${card.name} by ${card.publisher}${rating}, ${card.downloads} downloads`;
}

/**
 * The CV as compact Markdown for the model: everything the page shows as text, image refs
 * dropped. Deterministic (same input, same bytes), which prompt caching needs.
 */
export function renderCv(cv: Cv): string {
  const { header } = cv;
  const lines = [
    `# ${header.name}`,
    header.headline,
    header.tagline,
    '',
    '## Contacts',
    `- Email: ${header.contacts.email}`,
    `- Phone: ${header.contacts.phone}`,
    `- WhatsApp: ${header.contacts.whatsappUrl}`,
    `- Telegram: ${header.contacts.telegramUrl}`,
    '',
    '## Summary',
    ...cv.summary.map((line) => `- ${plain(line)}`),
    '',
    '## Technologies',
    ...cv.technologies.map((card) => `- ${card.title}: ${card.items.join(', ')}`),
    '',
    '## Latest relevant experience',
    ...cv.latestExperience.flatMap(experience),
    '',
    '## Apps',
    ...cv.apps.map(app),
    '',
    '## Education',
    ...cv.education.map((line) => `- ${line}`),
    '',
    '## About me: favourite books',
    ...cv.books.map((book) => `- ${book.title} by ${book.author}`),
    '',
    '## About me: interests',
    cv.interests,
    '',
    '## Previous experience',
    ...cv.previousExperience.flatMap(experience),
  ];
  return lines.join('\n');
}
