import { describe, expect, it, vi } from 'vitest';
import profileEn from '../../../src/data/mock/profile.en.json' with { type: 'json' };
import profileUk from '../../../src/data/mock/profile.uk.json' with { type: 'json' };
import type { Profile } from '../../../src/data/profile.js';
import { createPageKnowledgeLoader } from './assembleKnowledge.js';
import type { KnowledgeSource } from './KnowledgeSource.js';
import { ProfileKnowledgeSource } from './ProfileKnowledgeSource.js';
import { renderProfile } from './renderProfile.js';

const en = profileEn as Profile;
const uk = profileUk as Profile;

describe('renderProfile', () => {
  const text = renderProfile(en);

  it('renders every section of /new under English headings', () => {
    for (const heading of [
      '# Andrew Panasiuk',
      '## Contacts',
      '## Selected impact',
      '## How I build with agents',
      '## Experience',
      '## Earlier',
      '## Apps',
      '## Skills',
      '## Education',
      '## About',
    ]) {
      expect(text).toContain(heading);
    }
    expect(renderProfile(uk)).toContain('## Selected impact');
  });

  it('keeps what the page shows as text', () => {
    expect(text).toContain('AI Product Engineer\nMobile & Agentic Systems');
    expect(text).toContain('Wroclaw area · Remote / B2B across EU · Open to roles');
    expect(text).toContain(en.summary);
    expect(text).toContain('- Email: andriipanasiuk@gmail.com');
    expect(text).toContain('- Phone: +38 093 897-71-10');
    expect(text).toContain('- 1M+: users on each of Cync and August Home');
    expect(text).toContain('1. I frame the epic and decide open questions');
    expect(text).toContain('### Senior Android Developer, Transcenda, Feb 2021 – Feb 2026');
    expect(text).toContain('- Android Developer, custom UI framework inflater, Samsung, 2012');
    expect(text).toContain('- Cync: 5.0★ · 91.8K · 1M+');
    expect(text).toContain('- AI Engineering: Claude API, streaming');
    expect(text).toContain('M.Sc. Applied Mathematics & Cybernetics, Kyiv National University');
    expect(text).toContain('- Antifragile by Nassim Nicholas Taleb');
    expect(text).toContain('Off-screen: forest hiking');
  });

  it('drops image refs, the chat link row and the footer call to action', () => {
    for (const ref of ['photo', 'app_cync', 'book_the_goal']) {
      expect(text).not.toMatch(new RegExp(`\\b${ref}\\b`));
    }
    expect(text).not.toContain('#ask');
    expect(text).not.toContain(en.contacts.find((c) => c.id === 'ai-chat')?.label);
    expect(text).not.toContain(en.footer.label);
  });

  it('is deterministic, and the UK text is the UK profile', () => {
    expect(renderProfile(structuredClone(en))).toBe(text);
    const ukText = renderProfile(uk);
    expect(ukText).not.toBe(text);
    expect(ukText).toContain(uk.summary);
    expect(ukText).toMatch(/[А-яІіЇїЄєҐґ]/);
  });
});

describe('ProfileKnowledgeSource', () => {
  it('serves the profile in the requested locale', async () => {
    const source = new ProfileKnowledgeSource();
    await expect(source.load('en')).resolves.toEqual([
      { id: 'profile', title: 'Profile', text: renderProfile(en) },
    ]);
    await expect(source.load('uk')).resolves.toEqual([
      { id: 'profile', title: 'Profile', text: renderProfile(uk) },
    ]);
  });
});

describe('createPageKnowledgeLoader', () => {
  const source = (id: string, text = id): KnowledgeSource => ({
    id,
    load: vi.fn(async (locale) => [{ id, title: id, text: `${text} ${locale}` }]),
  });

  it("loads only the page's sources, memoized per page and locale", async () => {
    const cv = source('cv');
    const profile = source('profile');
    const load = createPageKnowledgeLoader({ cv: [cv], profile: [profile] });
    await expect(load('profile', 'uk')).resolves.toBe(
      '<knowledge>\n<document id="profile" title="profile">\nprofile uk\n</document>\n</knowledge>',
    );
    await load('profile', 'uk');
    await load('cv', 'uk');
    expect(profile.load).toHaveBeenCalledOnce();
    expect(cv.load).toHaveBeenCalledOnce();
  });

  it('names the page in the size warning', async () => {
    const warn = vi.fn();
    const big = source('big', 'a'.repeat(200_000));
    await createPageKnowledgeLoader({ cv: [], profile: [big] }, warn)('profile', 'en');
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/^profile: chat knowledge for en/));
  });
});
