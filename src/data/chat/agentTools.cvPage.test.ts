import type { CvPage } from '../cvPage';
import { StaticCvRepository } from '../mock/StaticCvRepository';
import { buildCvPageToolSpecs, cvPageTargetIds } from './agentTools';
import { CV_CONTACT_CHANNELS, CV_SECTION_IDS } from './contract';

const loadPage = () => new StaticCvRepository().getCvPage();

function enumOf(page: CvPage, tool: string, param: string): string[] | undefined {
  return buildCvPageToolSpecs(page).find((spec) => spec.name === tool)?.inputSchema.properties[
    param
  ]?.enum;
}

describe('buildCvPageToolSpecs', () => {
  it('lists three tools sorted by name', async () => {
    const specs = buildCvPageToolSpecs(await loadPage());
    expect(specs.map((spec) => [spec.name, spec.confirm])).toEqual([
      ['highlightElement', false],
      ['openContact', true],
      ['scrollToSection', false],
    ]);
  });

  it('is deterministic', async () => {
    const page = await loadPage();
    expect(JSON.stringify(buildCvPageToolSpecs(page))).toBe(
      JSON.stringify(buildCvPageToolSpecs(structuredClone(page))),
    );
  });

  it('has strict-compatible schemas with unique, non-empty enums', async () => {
    for (const { inputSchema } of buildCvPageToolSpecs(await loadPage())) {
      expect(inputSchema.additionalProperties).toBe(false);
      expect([...inputSchema.required].sort()).toEqual(Object.keys(inputSchema.properties).sort());
      for (const param of Object.values(inputSchema.properties)) {
        expect(param.enum.length).toBeGreaterThan(0);
        expect(new Set(param.enum).size).toBe(param.enum.length);
      }
    }
  });

  it('takes the section and contact enums from the contract', async () => {
    const page = await loadPage();
    expect(enumOf(page, 'scrollToSection', 'section')).toEqual([...CV_SECTION_IDS]);
    expect(enumOf(page, 'openContact', 'channel')).toEqual([...CV_CONTACT_CHANNELS]);
  });
});

describe('cvPageTargetIds', () => {
  it('lists 38 targets: sections, then the CvPage ids per kind in data order, then contacts', async () => {
    const page = await loadPage();
    const targets = cvPageTargetIds(page);
    expect(enumOf(page, 'highlightElement', 'target')).toEqual(targets);
    expect(targets).toHaveLength(38);
    expect(new Set(targets).size).toBe(targets.length);
    const ofKind = (kind: string) =>
      targets.filter((t) => t.startsWith(`${kind}:`)).map((t) => t.slice(kind.length + 1));
    expect(ofKind('section')).toEqual([...CV_SECTION_IDS]);
    expect(ofKind('impact')).toEqual(['users', 'design-system', 'ai-features']);
    expect(ofKind('experience')).toEqual(page.jobs.map((job) => job.id));
    expect(ofKind('app')).toEqual(['spoton', 'cync', 'august-home']);
    expect(ofKind('skill')).toEqual(page.skills.map((group) => group.id));
    expect(ofKind('book')).toEqual(page.about.books.map((book) => book.id));
    expect(ofKind('contact')).toEqual([...CV_CONTACT_CHANNELS]);
    expect(targets.at(0)).toBe('section:header');
    expect(targets.at(-1)).toBe('contact:linkedin');
  });

  it('follows changed data (ids come from the page)', async () => {
    const page = await loadPage();
    const changed: CvPage = {
      ...page,
      skills: page.skills.map((group, i) => (i === 0 ? { ...group, id: 'new-skill' } : group)),
    };
    expect(cvPageTargetIds(changed)).toContain('skill:new-skill');
  });
});
