import { StaticCvRepository } from '../data';
import { buildCvPageToolSpecs, type AgentToolSpec } from '../data/chat';
import { isValidToolInput } from './validate';

async function specOf(name: string): Promise<AgentToolSpec> {
  const page = await new StaticCvRepository().getCvPage();
  const spec = buildCvPageToolSpecs(page).find((s) => s.name === name);
  if (!spec) throw new Error(name);
  return spec;
}

describe('isValidToolInput', () => {
  it('accepts exactly the required enum param', async () => {
    const spec = await specOf('scrollToSection');
    expect(isValidToolInput(spec, { section: 'impact' })).toBe(true);
  });

  it.each([
    ['wrong enum value', { section: 'nowhere' }],
    ['missing field', {}],
    ['extra field', { section: 'impact', extra: 'x' }],
    ['wrong type', { section: 1 }],
    ['not an object', 'impact'],
    ['null', null],
    ['array', ['impact']],
  ])('rejects %s', async (_label, input) => {
    expect(isValidToolInput(await specOf('scrollToSection'), input)).toBe(false);
  });
});
