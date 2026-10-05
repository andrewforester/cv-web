import { render, screen } from '@testing-library/react';
import { AgentToolRegistry } from '../agent';
import { StaticCvRepository } from '../data';
import { buildAgentToolSpecs } from '../data/chat';
import { homeTestIds } from '../screens/home/testIds';
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
    await screen.findByTestId(homeTestIds.name);
    expect(registry.available()).not.toContain('switchLanguage');
    expect(screen.queryByRole('group', { name: 'Language' })).not.toBeInTheDocument();
  });

  describe('one page on every path', () => {
    afterEach(() => window.history.replaceState(null, '', '/'));

    it.each(['/', '/new', '/anything'])('renders the CV page on %s', async (path) => {
      window.history.replaceState(null, '', path);
      render(
        <AppProviders locale="en">
          <App />
        </AppProviders>,
      );

      expect(await screen.findByTestId(homeTestIds.name)).toHaveTextContent('Andrew Panasiuk');
      expect(screen.getAllByTestId(homeTestIds.root)).toHaveLength(1);
      expect(screen.queryByTestId('cv')).not.toBeInTheDocument();
      expect(screen.queryByTestId('profile')).not.toBeInTheDocument();
    });
  });
});
