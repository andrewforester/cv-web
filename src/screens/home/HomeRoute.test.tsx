import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import type { CvRepository } from '../../data';
import { HomeRoute } from './HomeRoute';
import { homeTestIds } from './testIds';

function renderHome(repository: CvRepository) {
  render(
    <AppProviders repository={repository} locale="en">
      <HomeRoute />
    </AppProviders>,
  );
}

describe('Home screen', () => {
  it('shows the name and title from the repository', async () => {
    const getCv = vi.fn().mockResolvedValue({ name: 'Test Name', title: 'Test Title' });
    renderHome({ getCv });

    expect(screen.getByTestId(homeTestIds.status)).toHaveTextContent('Loading…');
    expect(await screen.findByTestId(homeTestIds.name)).toHaveTextContent('Test Name');
    expect(screen.getByTestId(homeTestIds.title)).toHaveTextContent('Test Title');
    expect(getCv).toHaveBeenCalledWith('en');
  });

  it('shows an error when the repository fails', async () => {
    renderHome({ getCv: () => Promise.reject(new Error('offline')) });

    expect(await screen.findByText('Could not load the CV.')).toBeInTheDocument();
  });
});
