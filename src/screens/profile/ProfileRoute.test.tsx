import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import type { ProfileRepository } from '../../data';
import type { Locale } from '../../i18n';
import { ProfileRoute } from './ProfileRoute';
import { profileTestIds } from './testIds';

function renderProfile(locale: Locale, profileRepository?: ProfileRepository) {
  render(
    <AppProviders locale={locale} profileRepository={profileRepository}>
      <ProfileRoute />
    </AppProviders>,
  );
}

describe('Profile screen', () => {
  it('renders the name, headline and subtitle from mock data', async () => {
    renderProfile('en');

    expect(screen.getByTestId(profileTestIds.status)).toHaveTextContent('Loading…');
    expect(await screen.findByTestId(profileTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI Product Engineer');
    expect(screen.getByTestId(profileTestIds.subtitle)).toHaveTextContent(
      'Mobile & Agentic Systems',
    );
  });

  it('renders the Ukrainian profile', async () => {
    renderProfile('uk');

    expect(await screen.findByTestId(profileTestIds.name)).toHaveTextContent('Андрій Панасюк');
    expect(screen.getByTestId(profileTestIds.subtitle)).toHaveTextContent(
      'Мобільні та агентні системи',
    );
  });

  it('shows an error when the repository fails', async () => {
    renderProfile('en', { getProfile: () => Promise.reject(new Error('offline')) });

    expect(await screen.findByText('Could not load the CV.')).toBeInTheDocument();
  });
});
