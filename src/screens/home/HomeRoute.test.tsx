import { render, screen, within } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import type { CvPage, CvPageRepository } from '../../data';
import { HomeRoute } from './HomeRoute';
import { homeTestIds } from './testIds';

/** A small page unlike the mock, so the screen is proven to render whatever the data says. */
const FAKE_PAGE: CvPage = {
  meta: { location: 'Lviv', workMode: 'Hybrid', status: 'Busy' },
  name: 'Test Person',
  tagline: 'Fake tagline',
  photo: 'https://example.com/photo.jpg',
  headline: [{ text: 'Fake ' }, { text: 'Data', accent: true }, { text: ' Engineer' }],
  summary: ['Line one.', 'Line two.'],
  stats: [
    { id: 'a', value: '7', label: 'years' },
    { id: 'b', value: 'AI', label: 'owner', accent: true },
  ],
  contacts: [
    { id: 'email', label: 'test@example.com', href: 'mailto:test@example.com' },
    { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.example.com/1' },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://in.example.com/1' },
  ],
  craft: [
    { id: 'c1', label: 'then', title: 'By hand', text: 'Old way.' },
    { id: 'c2', label: 'now', title: 'With agents', text: 'New way.' },
  ],
  loop: {
    lead: 'Loop lead.',
    steps: [
      { id: 's1', text: 'Plan' },
      { id: 's2', text: 'Build' },
    ],
    footnote: 'it repeats',
  },
  impact: [{ id: 'i1', value: '2x', text: 'Faster builds.' }],
  jobs: [
    {
      id: 'acme',
      company: 'Acme',
      role: 'Engineer',
      period: '2020 – 2024',
      logo: 'https://example.com/acme.png',
      tag: 'product',
      about: 'An anvil shop.',
      meta: '1M+ · 4.5★',
      points: ['Did A.', 'Did B.'],
    },
    {
      id: 'globex',
      company: 'Globex',
      role: 'Lead',
      period: '2018',
      logo: 'https://example.com/globex.svg',
      logoPlain: true,
      points: [],
      projects: [
        {
          id: 'p1',
          name: 'Zeta',
          domain: 'Home',
          meta: '1K · 5.0★ · 10 reviews',
          about: 'Zeta app.',
          points: ['Shipped Z.'],
        },
      ],
    },
  ],
  skills: [{ id: 'k', title: 'Kotlin', items: 'Coroutines, Flow' }],
  education: {
    title: 'B.Sc. Testing',
    place: 'Test University',
    period: '2000–2004',
    text: 'Edu.',
  },
  about: {
    books: [{ id: 'b1', title: 'Book One', author: 'Author', cover: 'https://example.com/b.jpg' }],
    lines: [{ label: 'Off-screen:', text: 'tests.' }],
  },
  footer: { label: 'Write to me', href: 'mailto:test@example.com' },
};

const repositoryOf = (getCvPage: CvPageRepository['getCvPage']): CvPageRepository => ({
  getCvPage,
});

function renderHome(cvPageRepository?: CvPageRepository) {
  render(
    <AppProviders cvPageRepository={cvPageRepository}>
      <HomeRoute metaBarEnd={<button type="button">end control</button>} />
    </AppProviders>,
  );
}

const texts = (testId: string) => screen.getAllByTestId(testId).map((item) => item.textContent);

describe('Home screen', () => {
  it('renders the header from the repository', async () => {
    renderHome(repositoryOf(() => Promise.resolve(FAKE_PAGE)));

    expect(screen.getByTestId(homeTestIds.status)).toHaveTextContent('Loading…');
    expect(await screen.findByTestId(homeTestIds.name)).toHaveTextContent('Test Person');
    const metaBar = screen.getByTestId(homeTestIds.metaBar);
    for (const text of ['~/andrew.panasiuk/cv', 'Lviv', 'Hybrid', 'Busy', 'end control']) {
      expect(within(metaBar).getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByText('Fake tagline')).toBeInTheDocument();
    expect(screen.getByTestId(homeTestIds.photo)).toHaveAttribute('src', FAKE_PAGE.photo);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fake Data Engineer');
    expect(screen.getByText('Data')).toHaveClass('accent');
    expect(screen.getByTestId(homeTestIds.summary)).toHaveTextContent('Line one.Line two.');
    expect(texts(homeTestIds.stat)).toEqual(['7years', 'AIowner']);
    expect(screen.getAllByTestId(homeTestIds.stat)[1]).toHaveClass('accent');

    const contacts = screen.getAllByTestId(homeTestIds.contact);
    expect(contacts.map((link) => link.textContent)).toEqual(['Email me↗', 'WhatsApp', 'LinkedIn']);
    expect(contacts[0]).toHaveAttribute('href', 'mailto:test@example.com');
    expect(contacts[0]).not.toHaveAttribute('target');
    expect(contacts[2]).toHaveAttribute('href', 'https://in.example.com/1');
    expect(contacts[2]).toHaveAttribute('target', '_blank');
  });

  it('renders every section in the design order', async () => {
    renderHome(repositoryOf(() => Promise.resolve(FAKE_PAGE)));
    await screen.findByTestId(homeTestIds.name);

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Code craft × agentic process',
      'How I build with agents',
      'Selected impact',
      'Experience',
      'Skills',
      'Write to me↗',
    ]);
    expect(texts(homeTestIds.craftCard)).toEqual(['thenBy handOld way.', 'nowWith agentsNew way.']);
    expect(screen.getByTestId(homeTestIds.loop)).toHaveTextContent('system with feedback');
    expect(texts(homeTestIds.loopStep)).toEqual(['01Plan', '02Build']);
    expect(screen.getByTestId(homeTestIds.loop)).toHaveTextContent('↺ it repeats');
    expect(texts(homeTestIds.impactCard)).toEqual(['2xFaster builds.']);
    expect(texts(homeTestIds.skill)).toEqual(['KotlinCoroutines, Flow']);

    const education = screen.getByTestId(homeTestIds.education);
    expect(within(education).getByText('Test University · 2000–2004')).toBeInTheDocument();
    const about = screen.getByTestId(homeTestIds.about);
    expect(within(about).getByRole('img', { name: 'Book One' })).toBeInTheDocument();
    expect(about).toHaveTextContent('Off-screen: tests.');
    expect(screen.getByText('© 2026 Andrew Panasiuk')).toBeInTheDocument();
  });

  it('renders jobs with their product line, points and project tree', async () => {
    renderHome(repositoryOf(() => Promise.resolve(FAKE_PAGE)));
    await screen.findByTestId(homeTestIds.name);

    const [acme, globex] = screen.getAllByTestId(homeTestIds.job) as [HTMLElement, HTMLElement];
    expect(acme).toHaveTextContent('Acme2020 – 2024Engineer1M+ · 4.5★productAn anvil shop.');
    expect(within(acme).getAllByRole('listitem')).toHaveLength(2);
    expect(acme.querySelector('img')).toHaveClass('tile');
    // Samsung-style plain logo: no tile, and no empty points list.
    expect(globex.querySelector('img')).not.toHaveClass('tile');
    const project = within(globex).getByTestId(homeTestIds.project);
    // Laid out like a job: name and store line, then the domain tag line, then the points.
    expect(project).toHaveTextContent('Zeta1K · 5.0★ · 10 reviewsHomeZeta app.Shipped Z.');
    // No icon in the data: the initials tile.
    expect(within(project).getByText('Z')).toHaveClass('initials');
  });

  it('closes with the email and the messenger pills', async () => {
    renderHome(repositoryOf(() => Promise.resolve(FAKE_PAGE)));
    await screen.findByTestId(homeTestIds.name);

    const footer = screen.getByTestId(homeTestIds.footer);
    expect(within(footer).getByRole('link', { name: /Write to me/ })).toHaveAttribute(
      'href',
      'mailto:test@example.com',
    );
    expect(texts(homeTestIds.footerLink)).toEqual(['test@example.com↗', 'WhatsApp', 'LinkedIn']);
  });

  it('shows the error state when the page cannot be loaded', async () => {
    renderHome(repositoryOf(() => Promise.reject(new Error('offline'))));

    expect(await screen.findByText('Could not load the CV.')).toBeInTheDocument();
    expect(screen.getByTestId(homeTestIds.metaBar)).toHaveTextContent('end control');
    expect(screen.queryByTestId(homeTestIds.header)).not.toBeInTheDocument();
  });

  it('puts every hook of the show contract on the bundled page', async () => {
    renderHome();
    await screen.findByTestId(homeTestIds.name);

    for (const [key, id] of Object.entries(homeTestIds)) {
      if (key === 'status') continue;
      expect(screen.queryAllByTestId(id).length, id).toBeGreaterThan(0);
    }
    expect(screen.getAllByTestId(homeTestIds.job)).toHaveLength(9);
    expect(screen.getAllByTestId(homeTestIds.project)).toHaveLength(3);
  });
});
