import { render, screen, within } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import type { Profile, ProfileRepository } from '../../data';
import type { Locale } from '../../i18n';
import { forestTestIds } from '../../shared/forest/testIds';
import { ProfileRoute } from './ProfileRoute';
import { profileTestIds } from './testIds';

/** A small profile unlike the mock, so the page is proven to render whatever the data says. */
const FAKE_PROFILE: Profile = {
  meta: { location: 'Lviv', workMode: 'Hybrid', status: 'Busy' },
  name: 'Test Person',
  headline: [{ text: 'Fake ' }, { text: 'Data', accent: true }, { text: ' Engineer' }],
  subtitle: 'Fake subtitle',
  photo: 'https://example.com/photo.jpg',
  summary: 'Fake summary.',
  contacts: [
    { id: 'email', label: 'test@example.com', href: 'mailto:test@example.com' },
    { id: 'ai-chat', label: 'Ask the chat', href: '#ask' },
  ],
  impact: [
    { id: 'a', value: '2x', text: 'Faster builds.' },
    { id: 'b', value: '0', text: 'Incidents.' },
  ],
  loop: {
    lead: 'Loop lead.',
    steps: [
      { id: 's1', text: 'Plan' },
      { id: 's2', text: 'Build' },
      { id: 's3', text: 'Ship' },
    ],
    footnote: 'it repeats',
  },
  jobs: [
    { id: 'acme', company: 'Acme', role: 'Engineer', period: '2020 – 2024', points: ['Did A.'] },
    { id: 'globex', company: 'Globex', role: 'Lead', period: '2018', points: ['Did B.', 'C.'] },
  ],
  earlier: [{ id: 'initech', company: 'Initech', role: 'Intern', period: '2010' }],
  apps: [{ id: 'app', name: 'Fake App', icon: 'https://example.com/app.png', meta: '4.9★' }],
  skills: [{ id: 'k', title: 'Kotlin', items: 'Coroutines, Flow' }],
  education: {
    title: 'B.Sc. Testing',
    place: 'Test University',
    period: '2000–2004',
    text: 'Edu.',
  },
  about: {
    books: [{ id: 'b1', title: 'Book One', author: 'Author', cover: 'https://example.com/b.jpg' }],
    text: ['Line one.', 'Line two.'],
  },
  footer: { label: 'Write to me', href: 'mailto:test@example.com' },
};

const fakeRepository: ProfileRepository = { getProfile: () => Promise.resolve(FAKE_PROFILE) };

function renderProfile(locale: Locale, profileRepository?: ProfileRepository) {
  render(
    <AppProviders locale={locale} profileRepository={profileRepository}>
      <ProfileRoute metaBarEnd={<button type="button">switch</button>} />
    </AppProviders>,
  );
}

const sectionLabels = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
const texts = (testId: string) => screen.getAllByTestId(testId).map((item) => item.textContent);

describe('Profile screen', () => {
  it('renders every section and item from the repository', async () => {
    renderProfile('en', fakeRepository);

    expect(screen.getByTestId(profileTestIds.status)).toHaveTextContent('Loading…');
    expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Test Person');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fake Data Engineer.');
    expect(screen.getByTestId(forestTestIds.subtitle)).toHaveTextContent('Fake subtitle');
    expect(screen.getByRole('img', { name: 'Test Person' })).toHaveAttribute(
      'src',
      FAKE_PROFILE.photo,
    );
    const metaBar = screen.getByTestId(forestTestIds.metaBar);
    for (const text of ['andrew.panasiuk / cv', 'Lviv', 'Hybrid', 'Busy', 'switch']) {
      expect(within(metaBar).getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByTestId(forestTestIds.lead)).toHaveTextContent('Fake summary.');
    expect(screen.getByRole('link', { name: 'Ask the chat' })).toHaveAttribute('href', '#ask');
    expect(screen.getAllByTestId(forestTestIds.contact)).toHaveLength(2);

    expect(sectionLabels()).toEqual([
      '01 — Selected impact',
      '02 — How I build with agents',
      '03 — Experience',
      '04 — Skills',
      '05 — Education',
      '06 — About me',
    ]);
    expect(texts(forestTestIds.impactCard)).toEqual(['2xFaster builds.', '0Incidents.']);
    expect(texts(forestTestIds.loopStep)).toEqual(['01Plan', '02Build', '03Ship']);
    expect(screen.getByTestId(forestTestIds.loopFootnote)).toHaveTextContent('↺ it repeats');

    const jobs = screen.getAllByTestId(forestTestIds.job);
    expect(jobs.map((job) => within(job).getByRole('heading').textContent)).toEqual([
      'Acme',
      'Globex',
    ]);
    expect(within(jobs[1] as HTMLElement).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByTestId(forestTestIds.earlier)).toHaveTextContent(
      'EarlierInitech — Intern (2010)',
    );
    expect(texts(forestTestIds.app)).toEqual(['Fake App4.9★']);
    expect(texts(forestTestIds.skill)).toEqual(['KotlinCoroutines, Flow']);

    const education = screen.getByTestId(profileTestIds.education);
    expect(within(education).getByText('Test University · 2000–2004')).toBeInTheDocument();
    const about = screen.getByTestId(profileTestIds.about);
    expect(within(about).getByRole('img', { name: 'Book One' })).toBeInTheDocument();
    expect(within(about).getByText('Line two.')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Write to me' })).toHaveAttribute(
      'href',
      'mailto:test@example.com',
    );
    expect(screen.getByTestId(forestTestIds.footer)).toHaveTextContent('© 2026 Andrew Panasiuk');
  });

  it('renders the English mock profile', async () => {
    renderProfile('en');

    expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI Product Engineer.');
    expect(screen.getByRole('link', { name: 'Live AI CV — ask it anything' })).toHaveAttribute(
      'href',
      '#ask',
    );
    expect(screen.getAllByTestId(forestTestIds.impactCard)).toHaveLength(4);
    expect(screen.getAllByTestId(forestTestIds.loopStep)).toHaveLength(6);
    expect(screen.getAllByTestId(forestTestIds.job)).toHaveLength(7);
    expect(screen.getAllByTestId(forestTestIds.app)).toHaveLength(3);
    expect(screen.getAllByTestId(forestTestIds.skill)).toHaveLength(6);
    expect(screen.getAllByTestId(forestTestIds.book)).toHaveLength(3);
  });

  it('renders the Ukrainian profile with Ukrainian labels', async () => {
    renderProfile('uk');

    expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Андрій Панасюк');
    expect(screen.getByTestId(forestTestIds.subtitle)).toHaveTextContent(
      'Мобільні та агентні системи',
    );
    expect(sectionLabels()).toEqual([
      '01 — Вибрані результати',
      '02 — Як я будую з агентами',
      '03 — Досвід',
      '04 — Навички',
      '05 — Освіта',
      '06 — Про мене',
    ]);
    expect(screen.getByTestId(forestTestIds.earlier)).toHaveTextContent(/^Раніше/);
    expect(screen.getByTestId(forestTestIds.footer)).toHaveTextContent('© 2026 Андрій Панасюк');
  });

  it('shows an error under the meta bar when the repository fails', async () => {
    renderProfile('en', { getProfile: () => Promise.reject(new Error('offline')) });

    expect(await screen.findByText('Could not load the CV.')).toBeInTheDocument();
    const metaBar = screen.getByTestId(forestTestIds.metaBar);
    expect(within(metaBar).getByRole('button', { name: 'switch' })).toBeInTheDocument();
    expect(screen.queryByTestId(forestTestIds.hero)).not.toBeInTheDocument();
  });
});
