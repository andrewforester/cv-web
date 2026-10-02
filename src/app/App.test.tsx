import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentToolRegistry } from '../agent';
import { StaticCvRepository } from '../data';
import { buildAgentToolSpecs } from '../data/chat';
import { cvTestIds } from '../screens/cv/testIds';
import { profileTestIds } from '../screens/profile/testIds';
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

  it('registers switchLanguage, which changes the page language', async () => {
    const registry = new AgentToolRegistry(
      buildAgentToolSpecs(await new StaticCvRepository().getCv('en')),
    );
    render(
      <AppProviders locale="en" agentRegistry={registry}>
        <App />
      </AppProviders>,
    );
    await screen.findByTestId(cvTestIds.name);
    expect(registry.available()).toContain('switchLanguage');

    const call = (locale: string) =>
      act(() => registry.execute({ id: '1', name: 'switchLanguage', input: { locale } }));
    expect(await call('uk')).toEqual({ ok: true });
    expect(document.documentElement.lang).toBe('uk');
    expect(screen.getByTestId(languageSwitcherTestIds.option('uk'))).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await call('uk')).toEqual({ ok: true });
    expect(await call('de')).toEqual({ ok: false, error: 'invalid_params' });
    expect(document.documentElement.lang).toBe('uk');
  });

  describe('routes', () => {
    afterEach(() => window.history.replaceState(null, '', '/'));

    function renderAt(path: string) {
      window.history.replaceState(null, '', path);
      render(
        <AppProviders locale="en">
          <App />
        </AppProviders>,
      );
    }

    it('renders the profile on /new, with the shared language switcher', async () => {
      renderAt('/new');

      expect(await screen.findByTestId(profileTestIds.name)).toHaveTextContent('Andrew Panasiuk');
      expect(screen.queryByTestId(cvTestIds.root)).not.toBeInTheDocument();
      expect(screen.getByTestId(languageSwitcherTestIds.option('uk'))).toBeInTheDocument();
    });

    it('still renders the CV on /', async () => {
      renderAt('/');

      expect(await screen.findByTestId(cvTestIds.name)).toHaveTextContent('Andrew Panasiuk');
      expect(screen.queryByTestId(profileTestIds.root)).not.toBeInTheDocument();
    });
  });
});
