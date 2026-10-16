import { render, waitFor } from '@testing-library/react';
import { CvPageRepositoryContext, StaticCvRepository } from '../data';
import { buildCvPageToolSpecs } from '../data/chat';
import { AgentProvider } from './AgentProvider';
import { AgentToolRegistry } from './AgentToolRegistry';

describe('AgentProvider', () => {
  it('fills the registry with the one page’s catalogue', async () => {
    const repository = new StaticCvRepository();
    const registry = new AgentToolRegistry();
    render(
      <CvPageRepositoryContext value={repository}>
        <AgentProvider registry={registry}>
          <p>page</p>
        </AgentProvider>
      </CvPageRepositoryContext>,
    );

    const expected = buildCvPageToolSpecs(await repository.getCvPage());
    await waitFor(() => expect(registry.specs()).toEqual(expected));
    expect(registry.specs().map((spec) => spec.name)).toEqual([
      'highlightElement',
      'openContact',
      'scrollToSection',
    ]);
  });
});
