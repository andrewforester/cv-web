import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentToolRegistry } from '../agent';
import { StaticCvRepository } from '../data';
import { buildAgentToolSpecs } from '../data/chat';
import { cvTestIds } from '../screens/cv/testIds';
import { profileTestIds } from '../screens/profile/testIds';
import { forestTestIds } from '../shared/forest/testIds';
import { languageSwitcherTestIds } from '../shared/LanguageSwitcher/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';

describe('App', () => {
  it('switches to Ukrainian (CV content in English until translated) and remembers the choice', async () => {
    render(
      <AppProviders locale="en">
        <App />
      </AppProviders>,
    );
    expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');

    await userEvent.click(screen.getByTestId(languageSwitcherTestIds.option('uk')));

    expect(screen.getByRole('group', { name: 'Мова' })).toBeInTheDocument();
    expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');
    expect(screen.getByRole('heading', { name: '01 — Навички' })).toBeInTheDocument();
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
    await screen.findByTestId(forestTestIds.name);
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

    it('renders the profile on /new, with the language switcher in its meta bar', async () => {
      renderAt('/new');

      expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');
      expect(screen.queryByTestId(cvTestIds.root)).not.toBeInTheDocument();
      const metaBar = screen.getByTestId(forestTestIds.metaBar);
      expect(within(metaBar).getByTestId(languageSwitcherTestIds.option('uk'))).toBeInTheDocument();
    });

    it('renders the CV on /, with the language switcher in its meta bar', async () => {
      renderAt('/');

      expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');
      expect(screen.getByTestId(cvTestIds.root)).toBeInTheDocument();
      expect(screen.queryByTestId(profileTestIds.root)).not.toBeInTheDocument();
      const metaBar = screen.getByTestId(forestTestIds.metaBar);
      expect(within(metaBar).getByTestId(languageSwitcherTestIds.option('uk'))).toBeInTheDocument();
    });
  });
});
