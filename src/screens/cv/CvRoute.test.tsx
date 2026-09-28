import { render, screen, within } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import { StaticCvRepository, type CvRepository } from '../../data';
import { CvRoute } from './CvRoute';
import { cvTestIds } from './testIds';

function renderCv(repository: CvRepository = new StaticCvRepository()) {
  render(
    <AppProviders repository={repository} locale="en">
      <CvRoute />
    </AppProviders>,
  );
}

describe('CV screen', () => {
  it('renders the header, all technology cards and the latest experience from mock data', async () => {
    renderCv();

    expect(screen.getByTestId(cvTestIds.status)).toHaveTextContent('Loading…');
    expect(await screen.findByTestId(cvTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getByRole('link', { name: 'andriipanasiuk@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:andriipanasiuk@gmail.com',
    );
    expect(screen.getByRole('link', { name: '+38 093 897-71-10' })).toHaveAttribute(
      'href',
      'tel:+380938977110',
    );

    const cards = screen.getAllByTestId(cvTestIds.technologyCard);
    expect(cards).toHaveLength(9);
    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
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

    const latest = screen.getByTestId(cvTestIds.latestExperience);
    expect(within(latest).getByRole('heading', { name: 'Transcenda' })).toBeInTheDocument();
    expect(within(latest).getByText('Senior Android Developer')).toBeInTheDocument();
    expect(within(latest).getByText('Feb 2021 - Feb 2026')).toBeInTheDocument();
  });

  it('renders apps, education, about me and previous experience from mock data', async () => {
    renderCv();
    await screen.findByTestId(cvTestIds.root);

    const apps = screen.getAllByTestId(cvTestIds.appCard);
    expect(apps.map((app) => within(app).getByRole('heading').textContent)).toEqual([
      'Cync',
      'August Home',
      'Savant',
    ]);
    const [cync, , savant] = apps as [HTMLElement, HTMLElement, HTMLElement];
    expect(within(cync).getByTestId(cvTestIds.appRating)).toHaveTextContent('5.0');
    expect(within(cync).getByText('91.8K reviews')).toBeInTheDocument();
    expect(within(savant).queryByTestId(cvTestIds.appRating)).not.toBeInTheDocument();
    expect(within(savant).getByText('100k+')).toBeInTheDocument();
    expect(within(savant).getByText('Downloads')).toBeInTheDocument();

    expect(screen.getByTestId(cvTestIds.education)).toHaveTextContent(
      'Kyiv National University 2007 - 2012',
    );

    const books = screen.getAllByTestId(cvTestIds.book);
    expect(books).toHaveLength(4);
    expect(within(books[1] as HTMLElement).getByRole('img', { name: 'Siddhartha' })).toBeVisible();
    expect(books[1]).toHaveTextContent('Hermann Hesse');
    expect(screen.getByTestId(cvTestIds.interests)).toHaveTextContent('AI experiments');

    const previous = screen.getByTestId(cvTestIds.previousExperience);
    const entries = within(previous).getAllByTestId(cvTestIds.experienceEntry);
    expect(entries.map((entry) => within(entry).getByRole('img').getAttribute('alt'))).toEqual([
      'WiseHouse',
      'Attendify',
      'RosFines',
      'Smartling',
      'Rokkit',
      'ivi',
      'Samsung',
    ]);
    expect(within(previous).getAllByText('remotely')).toHaveLength(3);
  });

  it('shows an error when the repository fails', async () => {
    renderCv({ getCv: () => Promise.reject(new Error('offline')) });

    expect(await screen.findByText('Could not load the CV.')).toBeInTheDocument();
  });
});
