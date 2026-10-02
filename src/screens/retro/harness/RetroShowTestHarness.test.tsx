import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../../app/AppProviders';
import { FakeShowRepository, ShowRepositoryContext } from '../../../data/retro';
import { forestTestIds } from '../../../shared/forest/testIds';
import { profileTestIds } from '../../profile/testIds';
import { registeredSources } from '../scenarios';
import { retroTestIds } from '../testIds';
import { RetroShowTestHarness } from './RetroShowTestHarness';

// `?scenario=<id>` has to open every registered scenario's show over its own page.
describe.each(registeredSources())('harness ?scenario=%s', (scenario, source) => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('runs the show over the scenario page', async () => {
    window.history.replaceState(null, '', `/?scenario=${scenario}`);
    render(
      <AppProviders locale="en">
        <ShowRepositoryContext value={new FakeShowRepository()}>
          <RetroShowTestHarness />
        </ShowRepositoryContext>
      </AppProviders>,
    );
    const pageId = source.page === 'profile' ? profileTestIds.root : forestTestIds.name;
    expect(await screen.findByTestId(pageId)).toBeInTheDocument();
    expect(await screen.findByTestId(retroTestIds.dock)).toBeInTheDocument();
    expect(document.querySelector('[data-retro-stage]')).not.toBeNull();
  });
});
