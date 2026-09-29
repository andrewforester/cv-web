import { LOCALES } from '../../i18n/locale';
import { StaticCvRepository } from '../mock/StaticCvRepository';
import type { Cv } from '../models';
import { agentTargetIds, buildAgentToolSpecs } from './agentTools';
import { AGENT_TOOL_NAMES, CHAT_LOCALES } from './contract';

const repository = new StaticCvRepository();
const cvEn = () => repository.getCv('en');

function enumOf(cv: Cv, tool: string, param: string): string[] | undefined {
  return buildAgentToolSpecs(cv).find((spec) => spec.name === tool)?.inputSchema.properties[param]
    ?.enum;
}

describe('buildAgentToolSpecs', () => {
  it('lists every tool once, sorted by name', async () => {
    const names = buildAgentToolSpecs(await cvEn()).map((spec) => spec.name);
    expect(names).toEqual([...names].sort());
    expect(names).toEqual([...AGENT_TOOL_NAMES]);
  });

  it('is deterministic and the same in every locale', async () => {
    const expected = JSON.stringify(buildAgentToolSpecs(await cvEn()));
    expect(JSON.stringify(buildAgentToolSpecs(await cvEn()))).toBe(expected);
    for (const locale of LOCALES) {
      expect(JSON.stringify(buildAgentToolSpecs(await repository.getCv(locale)))).toBe(expected);
    }
  });

  it('has strict-compatible schemas: objects, all params required, enums, nothing extra', async () => {
    for (const spec of buildAgentToolSpecs(await cvEn())) {
      const { inputSchema } = spec;
      expect(inputSchema.type).toBe('object');
      expect(inputSchema.additionalProperties).toBe(false);
      expect([...inputSchema.required].sort()).toEqual(Object.keys(inputSchema.properties).sort());
      for (const param of Object.values(inputSchema.properties)) {
        expect(param.type).toBe('string');
        expect(param.enum.length).toBeGreaterThan(0);
        expect(new Set(param.enum).size).toBe(param.enum.length);
      }
      expect(spec.description.trim()).not.toBe('');
    }
  });

  it('asks for confirmation for every outward or irreversible verb', async () => {
    const outward = /^(open|submit|send|pay|buy|delete|remove)/;
    for (const spec of buildAgentToolSpecs(await cvEn())) {
      if (outward.test(spec.name)) expect(spec.confirm, spec.name).toBe(true);
    }
    const confirmed = buildAgentToolSpecs(await cvEn()).filter((spec) => spec.confirm);
    expect(confirmed.map((spec) => spec.name)).toEqual(['openContact']);
  });

  it('takes the section, contact and locale enums from the contract', async () => {
    const cv = await cvEn();
    expect(enumOf(cv, 'scrollToSection', 'section')).toEqual([
      'header',
      'summary',
      'technologies',
      'latest-experience',
      'apps',
      'education',
      'about',
      'previous-experience',
    ]);
    expect(enumOf(cv, 'openContact', 'channel')).toEqual([
      'email',
      'phone',
      'whatsapp',
      'telegram',
    ]);
    expect(enumOf(cv, 'switchLanguage', 'locale')).toEqual([...CHAT_LOCALES]);
  });

  it('builds highlight targets from the CV ids in data order', async () => {
    const cv = await cvEn();
    const targets = enumOf(cv, 'highlightElement', 'target') ?? [];
    expect(targets).toEqual(agentTargetIds(cv));
    const ofKind = (kind: string) =>
      targets.filter((t) => t.startsWith(`${kind}:`)).map((t) => t.slice(kind.length + 1));
    expect(ofKind('section')).toHaveLength(8);
    expect(ofKind('technology')).toEqual(cv.technologies.map((card) => card.id));
    expect(ofKind('technology')).toContain('kotlin');
    expect(ofKind('experience')).toEqual([
      'transcenda',
      'wisehouse',
      'attendify',
      'rosfines',
      'smartling',
      'rokkit',
      'ivi',
      'samsung',
    ]);
    expect(ofKind('app')).toEqual(['cync', 'august-home', 'savant']);
    expect(ofKind('book')).toEqual(cv.books.map((book) => book.id));
    expect(ofKind('contact')).toEqual(['email', 'phone', 'whatsapp', 'telegram']);
  });

  it('follows a changed CV (ids come from the data)', async () => {
    const cv = await cvEn();
    const changed: Cv = {
      ...cv,
      apps: cv.apps.map((app, i) => (i === 0 ? { ...app, id: 'new-app' } : app)),
    };
    expect(enumOf(changed, 'highlightElement', 'target')).toContain('app:new-app');
    expect(enumOf(changed, 'highlightElement', 'target')).not.toContain('app:cync');
  });
});
