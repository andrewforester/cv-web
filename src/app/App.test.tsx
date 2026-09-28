import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cvTestIds } from '../screens/cv/testIds';
import { languageSwitcherTestIds } from '../shared/LanguageSwitcher/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';

describe('App', () => {
  it('switches to Ukrainian (English texts until translated) and remembers the choice', async () => {
    render(
      <AppProviders locale="en">
        <App />
      </AppProviders>,
    );
    expect(await screen.findByTestId(cvTestIds.name)).toHaveTextContent('Andrew Panasiuk');

    await userEvent.click(screen.getByTestId(languageSwitcherTestIds.option('uk')));

    expect(screen.getByRole('group', { name: 'Мова' })).toBeInTheDocument();
    expect(await screen.findByTestId(cvTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('uk');
    expect(localStorage.getItem('cv.locale')).toBe('uk');
  });
});
