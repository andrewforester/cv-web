import { describe, expect, it, vi } from 'vitest';
import { CV_PAGE } from '../cvPageData.js';
import { createCvPageKnowledgeLoader } from './assembleKnowledge.js';
import { CvPageKnowledgeSource } from './CvPageKnowledgeSource.js';
import type { KnowledgeSource } from './KnowledgeSource.js';
import { renderCvPage } from './renderCvPage.js';
import { CV_PAGE_KNOWLEDGE_SOURCES } from './sources.js';

describe('renderCvPage', () => {
  const text = renderCvPage(CV_PAGE);

  it('renders every section of the page under English headings, in page order', () => {
    const headings = [
      '# Andrew Panasiuk',
      '## Key facts',
      '## Contacts',
      '## Code craft × agentic process',
      '## How I build with agents',
      '## Selected impact',
      '## Experience',
      '## Skills',
      '## Education',
      '## About me',
    ];
    const positions = headings.map((heading) => text.indexOf(`${heading}\n`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('keeps what the page shows as text', () => {
    for (const line of [
      'Senior Software Product Engineer',
      'Android since 2012 · Agentic engineering',
      'Wrocław area, Poland · Remote / B2B across EU · Open to roles',
      ...CV_PAGE.summary,
      '- 12+: years shipping apps in code',
      '- Email: andriipanasiuk@gmail.com',
      '- LinkedIn: https://www.linkedin.com/in/andriipanasiuk/',
      '### now → with agents: The process is the product I engineer',
      '6. Retro → rule changes',
      '- 3 days: vs. ~2-week estimate',
      '### Personal product · process architect, AI-powered CV, Sep 2026',
      'product: Interactive CV with an AI chat and page agent.',
      '### Senior Android Engineer, Transcenda, 2021 – 2026',
      '#### Cync, Smart Home, 1M+ · 5.0★ · 91.8K reviews',
      '- Increased code coverage across the codebase: 0% → 30%.',
      'Store: 1M+ · 4.5★',
      'tool: Internal tool that automated work 20 developers were repeating by hand.',
      '- AI engineering: LLM APIs, streaming',
      'M.Sc. Applied Mathematics & Cybernetics, Kyiv National University, 2007–2012',
      '- Siddhartha by Hermann Hesse',
      'Off-screen: forest hiking',
    ]) {
      expect(text).toContain(line);
    }
  });

  it('drops image refs and the footer call to action', () => {
    for (const ref of ['photo', 'logo_transcenda', 'logo_samsung', 'app_cync', 'book_the_goal']) {
      expect(text).not.toMatch(new RegExp(`\\b${ref}\\b`));
    }
    expect(text).not.toContain(CV_PAGE.footer.label);
    expect(text).not.toContain('mailto:');
  });

  it('is deterministic', () => {
    expect(renderCvPage(structuredClone(CV_PAGE))).toBe(text);
  });
});

describe('CvPageKnowledgeSource', () => {
  it('serves the one page as the "cv" document', async () => {
    await expect(new CvPageKnowledgeSource().load()).resolves.toEqual([
      { id: 'cv', title: 'CV', text: renderCvPage(CV_PAGE) },
    ]);
  });
});

describe('createCvPageKnowledgeLoader', () => {
  it('wraps the page in <document id="cv"> inside one <knowledge> element', async () => {
    const knowledge = await createCvPageKnowledgeLoader(CV_PAGE_KNOWLEDGE_SOURCES)();
    expect(knowledge).toBe(
      `<knowledge>\n<document id="cv" title="CV">\n${renderCvPage(CV_PAGE)}\n</document>\n</knowledge>`,
    );
  });

  it('loads once: the same text for every request', async () => {
    const source: KnowledgeSource = { id: 'cv', load: vi.fn(async () => []) };
    const load = createCvPageKnowledgeLoader([source]);
    expect(await load()).toBe(await load());
    expect(source.load).toHaveBeenCalledOnce();
  });
});
