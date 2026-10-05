import { render, screen } from '@testing-library/react';
import { homeTestIds } from '../screens/home/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';

describe('App', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it.each(['/', '/new', '/anything'])('renders the one CV page on %s', async (path) => {
    window.history.replaceState(null, '', path);
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByTestId(homeTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getAllByTestId(homeTestIds.root)).toHaveLength(1);
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
  });
});
