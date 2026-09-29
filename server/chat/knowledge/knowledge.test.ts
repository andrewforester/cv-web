import { describe, expect, it, vi } from 'vitest';
import type { Cv } from '../../../src/data/models.js';
import cvEn from '../../../src/data/mock/cv.en.json' with { type: 'json' };
import { createKnowledgeLoader } from './assembleKnowledge.js';
import { CvKnowledgeSource } from './CvKnowledgeSource.js';
import type { KnowledgeSource } from './KnowledgeSource.js';
import { renderCv } from './renderCv.js';

const cv = cvEn as Cv;

describe('renderCv', () => {
  const text = renderCv(cv);

  it('renders every section of the page', () => {
    for (const heading of [
      '# Andrew Panasiuk',
      '## Contacts',
      '## Summary',
      '## Technologies',
      '## Latest relevant experience',
      '## Apps',
      '## Education',
      '## About me: favourite books',
      '## About me: interests',
      '## Previous experience',
    ]) {
      expect(text).toContain(heading);
    }
  });

  it('keeps the facts and flattens rich text', () => {
    expect(text).toContain('- Email: andriipanasiuk@gmail.com');
    expect(text).toContain(
      '- Product-minded Senior Android Engineer with 12+ years of experience.',
    );
    expect(text).toContain('### Senior Android Developer, Transcenda, Feb 2021 - Feb 2026');
    expect(text).toContain(
      '- Cync by Savant Systems, Inc., rating 5.0 (91.8K reviews), 1M+ downloads',
    );
    expect(text).toContain('- Savant by Savant Systems, Inc., 100k+ downloads');
    expect(text).toContain('### Android SDK Developer, Smartling (remote), Feb 2016 - Aug 2017');
    expect(text).toContain('- Antifragile by Nassim Nicholas Taleb');
    expect(text).toContain(
      '- Kotlin: Coroutines, Ktor, Flow, Kotlinx-serialization, Kotlin Multiplatform',
    );
  });

  it('drops image refs and is deterministic', () => {
    for (const ref of ['photo', 'logo_transcenda', 'app_cync', 'book_antifragile']) {
      expect(text).not.toMatch(new RegExp(`\\b${ref}\\b`));
    }
    expect(renderCv(structuredClone(cv))).toBe(text);
  });
});

describe('CvKnowledgeSource', () => {
  it('serves the English CV, and falls back to it for uk', async () => {
    const source = new CvKnowledgeSource();
    const en = await source.load('en');
    expect(en).toEqual([{ id: 'cv', title: 'CV', text: renderCv(cv) }]);
    await expect(source.load('uk')).resolves.toEqual(en);
  });
});

describe('createKnowledgeLoader', () => {
  const source = (id: string, text: string): KnowledgeSource => ({
    id,
    load: vi.fn(async () => [{ id, title: `Title ${id}`, text }]),
  });

  it('wraps all documents in registry order in one <knowledge> element', async () => {
    const load = createKnowledgeLoader([source('cv', 'CV text'), source('cases', 'Cases')]);
    await expect(load('en')).resolves.toBe(
      '<knowledge>\n' +
        '<document id="cv" title="Title cv">\nCV text\n</document>\n' +
        '<document id="cases" title="Title cases">\nCases\n</document>\n' +
        '</knowledge>',
    );
  });

  it('memoizes per locale', async () => {
    const cvSource = source('cv', 'CV');
    const load = createKnowledgeLoader([cvSource]);
    await load('en');
    await load('en');
    await load('uk');
    expect(cvSource.load).toHaveBeenCalledTimes(2);
  });

  it('warns above 50,000 estimated tokens', async () => {
    const warn = vi.fn();
    await createKnowledgeLoader([source('big', 'a'.repeat(200_000))], warn)('en');
    expect(warn).toHaveBeenCalledOnce();
  });
});
