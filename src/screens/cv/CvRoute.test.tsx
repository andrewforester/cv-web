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

  it('shows an error when the repository fails', async () => {
    renderCv({ getCv: () => Promise.reject(new Error('offline')) });

    expect(await screen.findByText('Could not load the CV.')).toBeInTheDocument();
  });
});
