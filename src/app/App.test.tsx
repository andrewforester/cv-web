import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { homeTestIds } from '../screens/home/testIds';
import { languageSwitcherTestIds } from '../shared/LanguageSwitcher/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';

describe('App', () => {
  it('switches every text to Ukrainian and remembers the choice', async () => {
    render(
      <AppProviders locale="en">
        <App />
      </AppProviders>,
    );
    expect(await screen.findByTestId(homeTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getByText('Hello, I am')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId(languageSwitcherTestIds.option('uk')));

    expect(await screen.findByText('Андрій Панасюк')).toBeInTheDocument();
    expect(screen.getByText('Привіт, я')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Мова' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('uk');
    expect(localStorage.getItem('cv.locale')).toBe('uk');
  });
});
