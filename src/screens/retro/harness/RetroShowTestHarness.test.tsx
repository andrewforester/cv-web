import { render, screen } from '@testing-library/react';
import { AppProviders } from '../../../app/AppProviders';
import { FakeShowRepository, ShowRepositoryContext } from '../../../data/retro';
import { homeTestIds } from '../../home/testIds';
import { retroTestIds } from '../testIds';
import { RetroShowTestHarness } from './RetroShowTestHarness';

describe('harness', () => {
  it('runs the show over the page', async () => {
    render(
      <AppProviders locale="en">
        <ShowRepositoryContext value={new FakeShowRepository()}>
          <RetroShowTestHarness />
        </ShowRepositoryContext>
      </AppProviders>,
    );
    expect(await screen.findByTestId(homeTestIds.name)).toBeInTheDocument();
    expect(await screen.findByTestId(retroTestIds.dock)).toBeInTheDocument();
    expect(document.querySelector('[data-retro-stage]')).not.toBeNull();
  });
});
