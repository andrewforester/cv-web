import { LOCALES } from '../../i18n/locale';
import { StaticCvRepository } from '../mock/StaticCvRepository';
import type { Profile } from '../profile';
import { buildAgentToolSpecs, buildProfileToolSpecs, profileTargetIds } from './agentTools';
import { AGENT_TOOL_NAMES, CHAT_LOCALES, PROFILE_SECTION_IDS } from './contract';

const repository = new StaticCvRepository();
const profileEn = () => repository.getProfile('en');

function enumOf(profile: Profile, tool: string, param: string): string[] | undefined {
  return buildProfileToolSpecs(profile).find((spec) => spec.name === tool)?.inputSchema.properties[
    param
  ]?.enum;
}

describe('buildProfileToolSpecs', () => {
  it('lists the same four tools as the CV, sorted by name', async () => {
    const names = buildProfileToolSpecs(await profileEn()).map((spec) => spec.name);
    expect(names).toEqual([...AGENT_TOOL_NAMES]);
  });

  it('is deterministic and the same in every locale', async () => {
    const expected = JSON.stringify(buildProfileToolSpecs(await profileEn()));
    expect(JSON.stringify(buildProfileToolSpecs(await profileEn()))).toBe(expected);
    for (const locale of LOCALES) {
      const profile = await repository.getProfile(locale);
      expect(JSON.stringify(buildProfileToolSpecs(profile))).toBe(expected);
    }
  });

  it('differs from the CV catalogue only in its enums and descriptions', async () => {
    const cvSpecs = buildAgentToolSpecs(await repository.getCv('en'));
    const specs = buildProfileToolSpecs(await profileEn());
    expect(specs.map((spec) => [spec.name, spec.confirm])).toEqual(
      cvSpecs.map((spec) => [spec.name, spec.confirm]),
    );
    expect(specs.find((spec) => spec.name === 'switchLanguage')).toEqual(
      cvSpecs.find((spec) => spec.name === 'switchLanguage'),
    );
  });

  it('has strict-compatible schemas with unique, non-empty enums', async () => {
    for (const { inputSchema } of buildProfileToolSpecs(await profileEn())) {
      expect(inputSchema.additionalProperties).toBe(false);
      expect([...inputSchema.required].sort()).toEqual(Object.keys(inputSchema.properties).sort());
      for (const param of Object.values(inputSchema.properties)) {
        expect(param.enum.length).toBeGreaterThan(0);
        expect(new Set(param.enum).size).toBe(param.enum.length);
      }
    }
  });

  it('takes the section, contact and locale enums from the contract', async () => {
    const profile = await profileEn();
    expect(enumOf(profile, 'scrollToSection', 'section')).toEqual([...PROFILE_SECTION_IDS]);
    expect(enumOf(profile, 'openContact', 'channel')).toEqual(['email', 'phone']);
    expect(enumOf(profile, 'switchLanguage', 'locale')).toEqual([...CHAT_LOCALES]);
  });
});

describe('profileTargetIds', () => {
  it('lists sections, then the Profile ids per kind in data order, then contacts', async () => {
    const profile = await profileEn();
    const targets = profileTargetIds(profile);
    expect(enumOf(profile, 'highlightElement', 'target')).toEqual(targets);
    const ofKind = (kind: string) =>
      targets.filter((t) => t.startsWith(`${kind}:`)).map((t) => t.slice(kind.length + 1));
    const ids = (list: { id: string }[]) => list.map((item) => item.id);
    expect(ofKind('section')).toEqual([...PROFILE_SECTION_IDS]);
    expect(ofKind('impact')).toEqual(ids(profile.impact));
    expect(ofKind('experience')).toEqual([...ids(profile.jobs), ...ids(profile.earlier)]);
    expect(ofKind('app')).toEqual(ids(profile.apps));
    expect(ofKind('skill')).toEqual(ids(profile.skills));
    expect(ofKind('book')).toEqual(ids(profile.about.books));
    expect(ofKind('contact')).toEqual(['email', 'phone']);
    expect(targets).toHaveLength(new Set(targets).size);
    expect(targets).not.toContain('contact:ai-chat');
    expect(targets.some((t) => t.startsWith('technology:'))).toBe(false);
  });

  it('follows a changed profile (ids come from the data)', async () => {
    const profile = await profileEn();
    const changed: Profile = {
      ...profile,
      skills: profile.skills.map((group, i) => (i === 0 ? { ...group, id: 'new-skill' } : group)),
    };
    expect(profileTargetIds(changed)).toContain('skill:new-skill');
  });
});
