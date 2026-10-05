import { render, screen } from '@testing-library/react';
import { AgentToolRegistry } from '../agent';
import { StaticCvRepository } from '../data';
import { buildAgentToolSpecs } from '../data/chat';
import { cvTestIds } from '../screens/cv/testIds';
import { profileTestIds } from '../screens/profile/testIds';
import { forestTestIds } from '../shared/forest/testIds';
import { App } from './App';
import { AppProviders } from './AppProviders';

describe('App', () => {
  it('does not offer the page agent a switchLanguage tool', async () => {
    const registry = new AgentToolRegistry(
      buildAgentToolSpecs(await new StaticCvRepository().getCv('en')),
    );
    render(
      <AppProviders locale="en" agentRegistry={registry}>
        <App />
      </AppProviders>,
    );
    await screen.findByTestId(forestTestIds.name);
    expect(registry.available()).not.toContain('switchLanguage');
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
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

    it('renders the profile on /new, without a language switcher', async () => {
      renderAt('/new');

      expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');
      expect(screen.queryByTestId(cvTestIds.root)).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
    });

    it('renders the CV on /, without a language switcher', async () => {
      renderAt('/');

      expect(await screen.findByTestId(forestTestIds.name)).toHaveTextContent('Andrew Panasiuk');
      expect(screen.getByTestId(cvTestIds.root)).toBeInTheDocument();
      expect(screen.queryByTestId(profileTestIds.root)).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
    });
  });
});
