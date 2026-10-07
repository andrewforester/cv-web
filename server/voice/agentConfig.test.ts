import { describe, expect, it } from 'vitest';
import { buildCvPageToolSpecs, cvPageTargetIds } from '../../src/data/chat/agentTools.js';
import { CV_SECTION_IDS } from '../../src/data/chat/contract.js';
import { CV_PAGE } from '../chat/cvPageData.js';
import { createCvPageKnowledgeLoader } from '../chat/knowledge/assembleKnowledge.js';
import { CV_PAGE_KNOWLEDGE_SOURCES } from '../chat/knowledge/sources.js';
import {
  INSTRUCTIONS,
  KNOWLEDGE_RULES,
  SAFETY_RULES,
  SCOPE_RULES,
} from '../chat/prompt/systemPrompt.js';
import { buildVoiceAgentConfig, VOICE_FIRST_MESSAGE } from './agentConfig.js';
import { VOICE_PROMPT_VERSION } from './prompt/voicePrompt.js';

const knowledge = await createCvPageKnowledgeLoader(CV_PAGE_KNOWLEDGE_SOURCES)();
const config = buildVoiceAgentConfig(knowledge, CV_PAGE);

describe('buildVoiceAgentConfig', () => {
  it('is deterministic', () => {
    expect(buildVoiceAgentConfig(knowledge, CV_PAGE)).toEqual(config);
  });

  it('shares the text chat rules and the same knowledge bytes', () => {
    for (const block of [KNOWLEDGE_RULES, SCOPE_RULES, SAFETY_RULES]) {
      expect(INSTRUCTIONS).toContain(block);
      expect(config.prompt).toContain(block);
    }
    expect(config.prompt.endsWith(`\n\n${knowledge}`)).toBe(true);
    expect(knowledge.startsWith('<knowledge>')).toBe(true);
  });

  it('speaks: no written-format rules, asks before openContact, no page state', () => {
    expect(config.prompt).not.toContain('Language and format');
    expect(config.prompt).not.toContain('<page_state>');
    expect(config.prompt).toContain('Shall I open his LinkedIn?');
  });

  it('caps the call at 180 s, opens in English and carries the prompt version', () => {
    expect(config.maxDurationSeconds).toBe(180);
    expect(config.promptVersion).toBe(VOICE_PROMPT_VERSION);
    expect(config.firstMessage).toBe(VOICE_FIRST_MESSAGE);
  });

  it("maps the catalogue's three tools with the same names, descriptions and enums", () => {
    const specs = buildCvPageToolSpecs(CV_PAGE);
    expect(config.tools.map((tool) => tool.name)).toEqual(specs.map((spec) => spec.name));
    for (const [index, tool] of config.tools.entries()) {
      const spec = specs[index];
      expect(tool.description).toBe(spec?.description);
      expect(tool.parameters.required).toEqual(spec?.inputSchema.required);
      expect(tool.parameters).not.toHaveProperty('additionalProperties');
      for (const [name, param] of Object.entries(tool.parameters.properties)) {
        expect(param).toEqual({ ...spec?.inputSchema.properties[name] });
      }
      expect(tool).toMatchObject({ type: 'client', expects_response: true });
    }
    const byName = Object.fromEntries(config.tools.map((tool) => [tool.name, tool]));
    expect(byName.scrollToSection?.parameters.properties.section?.enum).toEqual([
      ...CV_SECTION_IDS,
    ]);
    expect(byName.highlightElement?.parameters.properties.target?.enum).toEqual(
      cvPageTargetIds(CV_PAGE),
    );
    expect(byName.openContact?.parameters.properties.channel?.enum).toEqual([
      'email',
      'whatsapp',
      'linkedin',
    ]);
  });

  it('gives openContact 40 s for the confirmation tap, the others 5 s', () => {
    const timeouts = Object.fromEntries(
      config.tools.map((tool) => [tool.name, tool.response_timeout_secs]),
    );
    expect(timeouts).toEqual({ scrollToSection: 5, openContact: 40, highlightElement: 5 });
  });
});
