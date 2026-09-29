import { StaticCvRepository } from '../data';
import { buildAgentToolSpecs, type AgentToolSpec } from '../data/chat';
import { isValidToolInput } from './validate';

async function specOf(name: string): Promise<AgentToolSpec> {
  const cv = await new StaticCvRepository().getCv('en');
  const spec = buildAgentToolSpecs(cv).find((s) => s.name === name);
  if (!spec) throw new Error(name);
  return spec;
}

describe('isValidToolInput', () => {
  it('accepts exactly the required enum param', async () => {
    const spec = await specOf('scrollToSection');
    expect(isValidToolInput(spec, { section: 'apps' })).toBe(true);
  });

  it.each([
    ['wrong enum value', { section: 'nowhere' }],
    ['missing field', {}],
    ['extra field', { section: 'apps', extra: 'x' }],
    ['wrong type', { section: 1 }],
    ['not an object', 'apps'],
    ['null', null],
    ['array', ['apps']],
  ])('rejects %s', async (_label, input) => {
    expect(isValidToolInput(await specOf('scrollToSection'), input)).toBe(false);
  });
});
