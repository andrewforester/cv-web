import { render, screen, within } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import { StaticCvRepository, type CvRepository } from '../../data';
import { forestTestIds } from '../../shared/forest/testIds';
import { CvRoute } from './CvRoute';
import { cvTestIds } from './testIds';

function renderCv(repository: CvRepository = new StaticCvRepository(), locale: 'en' | 'uk' = 'en') {
  render(
    <AppProviders repository={repository} locale={locale}>
      <CvRoute />
    </AppProviders>,
  );
}

const headings = (elements: HTMLElement[]) =>
  elements.map((element) => within(element).getAllByRole('heading')[0]?.textContent);

describe('CV screen', () => {
  it('renders the hero, the summary and the contacts from mock data', async () => {
    renderCv();

    expect(screen.getByTestId(cvTestIds.status)).toHaveTextContent('Loading…');
    expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Senior Android Engineer with iOS experience.',
    );
    expect(screen.getByTestId(forestTestIds.subtitle)).toHaveTextContent(
      'Creating Android apps since 2012',
    );
    expect(screen.getByTestId(forestTestIds.lead)).toHaveTextContent('12+ years of experience');
    expect(screen.getByText('Senior Android Engineer', { selector: 'strong' })).toBeVisible();

    const contacts = within(screen.getByRole('list', { name: 'Contacts' }));
    expect(contacts.getByRole('link', { name: 'andriipanasiuk@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:andriipanasiuk@gmail.com',
    );
    expect(contacts.getByRole('link', { name: '+38 093 897-71-10' })).toHaveAttribute(
      'href',
      'tel:+380938977110',
    );
    const telegram = contacts.getByRole('link', { name: 'Telegram' });
    expect(telegram).toHaveAttribute('href', 'https://t.me/+380938977110');
    expect(telegram).toHaveAttribute('target', '_blank');
    expect(contacts.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/380938977110',
    );
  });

  it('renders numbered sections: skills and experience with its jobs and apps', async () => {
    renderCv();
    await screen.findByTestId(cvTestIds.root);

    const skills = screen.getByTestId(cvTestIds.skills);
    expect(within(skills).getByRole('heading', { level: 2 })).toHaveTextContent('01 — Skills');
    const groups = within(skills).getAllByTestId(forestTestIds.skill);
    expect(headings(groups)).toEqual([
      'Android',
      'Product mindset',
      'Unit/UI testing',
      'Kotlin',
      'Architecture',
      'Integrations',
      'AI Tools',
      'Tools',
      'iOS',
    ]);
    expect(groups[0]).toHaveTextContent('Jetpack Compose, Hilt, Room/SQLite');

    const experience = screen.getByTestId(cvTestIds.experience);
    expect(within(experience).getByRole('heading', { level: 2 })).toHaveTextContent(
      '02 — Experience',
    );
    const latest = screen.getByTestId(cvTestIds.latestExperience);
    expect(within(latest).getByRole('heading', { name: 'Transcenda' })).toBeInTheDocument();
    expect(within(latest).getByText('Feb 2021 - Feb 2026')).toBeInTheDocument();
    const previous = screen.getByTestId(cvTestIds.previousExperience);
    expect(headings(within(previous).getAllByTestId(forestTestIds.job))).toEqual([
      'WiseHouse',
      'Attendify',
      'RosFines',
      'Smartling',
      'Rokkit',
      'ivi',
      'Samsung',
    ]);
    expect(within(previous).getAllByText(/ · remotely$/)).toHaveLength(3);

    const apps = within(screen.getByTestId(cvTestIds.apps)).getAllByTestId(forestTestIds.app);
    expect(apps.map((app) => app.textContent)).toEqual([
      'Cync5.0★ · 91.8K · 1M+',
      'August Home4.1★ · 18.7K · 1M+',
      'Savant100k+',
    ]);
  });

  it('renders education, about me and the footer from mock data', async () => {
    renderCv();
    await screen.findByTestId(cvTestIds.root);

    const education = screen.getByTestId(cvTestIds.education);
    expect(within(education).getByRole('heading', { level: 2 })).toHaveTextContent(
      '03 — Education',
    );
    expect(within(education).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Applied Mathematics, Cybernetics',
    );
    expect(education).toHaveTextContent('Kyiv National University 2007 - 2012');

    const about = screen.getByTestId(cvTestIds.about);
    expect(within(about).getByRole('heading', { level: 2 })).toHaveTextContent('04 — About me');
    expect(within(about).getAllByTestId(forestTestIds.book)).toHaveLength(4);
    expect(within(about).getByRole('img', { name: 'Siddhartha — Hermann Hesse' })).toBeVisible();
    expect(about).toHaveTextContent('AI experiments');

    const footer = screen.getByTestId(forestTestIds.footer);
    expect(within(footer).getByRole('link')).toHaveAttribute(
      'href',
      'mailto:andriipanasiuk@gmail.com',
    );
    expect(footer).toHaveTextContent('© 2026 Andrew Panasiuk');
  });

  it('labels the sections in Ukrainian', async () => {
    renderCv(new StaticCvRepository(), 'uk');
    await screen.findByTestId(cvTestIds.root);

    expect(screen.getByRole('heading', { name: '01 — Навички' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '04 — Про мене' })).toBeInTheDocument();
    expect(screen.getAllByText(/ · віддалено$/)).toHaveLength(3);
  });

  it('shows an error when the repository fails', async () => {
    renderCv({ getCv: () => Promise.reject(new Error('offline')) });

    expect(await screen.findByText('Could not load the CV.')).toBeInTheDocument();
  });
});
