import { describe, expect, it } from 'vitest';
import { buildCvPageToolSpecs } from '../../../src/data/chat/agentTools.js';
import { CV_SECTION_IDS } from '../../../src/data/chat/contract.js';
import {
  PAGE_V4,
  questionV4,
  SCROLL_IMPACT,
  toolResults,
  toolTurn,
  v4Body,
} from '../../test/helpers.js';
import { CV_PAGE } from '../cvPageData.js';
import { HAIKU_4_5 } from '../llm/modelOptions.js';
import type { ValidatedChatV4 } from '../validateParts.js';
import { buildLlmRequest } from './buildLlmRequest.js';
import { LLM_TOOLS_V4 } from './llmTools.js';
import { pageStateBlock } from './renderMessagesV2.js';
import { INSTRUCTIONS, PAGE_TOOL_INSTRUCTIONS, SITE_LANGUAGE_LINE } from './systemPrompt.js';

const chat = (toolRound: number, ...messages: Parameters<typeof v4Body>): ValidatedChatV4 => ({
  ...v4Body(...messages),
  toolRound,
});

describe('buildLlmRequest: v4', () => {
  it("sends the one page's catalogue as strict tools: 3 tools, 38 targets", () => {
    const request = buildLlmRequest(chat(0), 'K', HAIKU_4_5);
    expect(Object.keys(request).slice(0, 3)).toEqual(['model', 'max_tokens', 'tools']);
    expect(request.tools).toEqual(
      buildCvPageToolSpecs(CV_PAGE).map(({ name, description, inputSchema }) => ({
        name,
        description,
        input_schema: inputSchema,
        strict: true,
      })),
    );
    expect(request.tools?.map((tool) => tool.name)).toEqual([
      'highlightElement',
      'openContact',
      'scrollToSection',
    ]);
    const enumOf = (name: string, param: string) =>
      buildCvPageToolSpecs(CV_PAGE).find((spec) => spec.name === name)?.inputSchema.properties[
        param
      ]?.enum;
    expect(enumOf('highlightElement', 'target')).toHaveLength(38);
    expect(enumOf('scrollToSection', 'section')).toEqual([...CV_SECTION_IDS]);
    expect(LLM_TOOLS_V4).toEqual(request.tools);
    expect(request.tool_choice).toEqual({ type: 'auto' });
  });

  it('sends the instructions, the page-tool rules, the knowledge (cache marker), then English', () => {
    const request = buildLlmRequest(chat(0), 'K', HAIKU_4_5);
    expect(request.system).toEqual([
      { type: 'text', text: INSTRUCTIONS },
      { type: 'text', text: PAGE_TOOL_INSTRUCTIONS },
      { type: 'text', text: 'K', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'Site language: English (en).' },
    ]);
    expect(SITE_LANGUAGE_LINE).toBe('Site language: English (en).');
    expect(request.cache_control).toEqual({ type: 'ephemeral' });
  });

  it('keeps tools and system byte-identical across requests', () => {
    const first = buildLlmRequest(chat(0), 'K', HAIKU_4_5);
    const later = buildLlmRequest(
      chat(1, questionV4('Show'), toolTurn([SCROLL_IMPACT]), toolResults([SCROLL_IMPACT])),
      'K',
      HAIKU_4_5,
    );
    expect(JSON.stringify(later.tools)).toBe(JSON.stringify(first.tools));
    expect(JSON.stringify(later.system)).toBe(JSON.stringify(first.system));
  });

  it('puts the v4 <page_state> (no route, no locale) before the question', () => {
    const request = buildLlmRequest(chat(0, questionV4('Show his impact')), 'K', HAIKU_4_5);
    expect(request.messages[0]?.content).toEqual([
      { type: 'text', text: pageStateBlock(PAGE_V4) },
      { type: 'text', text: 'Show his impact' },
    ]);
    expect(pageStateBlock(PAGE_V4)).not.toMatch(/route|locale/);
  });

  it('turns tools off after two rounds', () => {
    const turn = [toolTurn([SCROLL_IMPACT]), toolResults([SCROLL_IMPACT])] as const;
    const request = buildLlmRequest(chat(2, questionV4('Show'), ...turn, ...turn), 'K', HAIKU_4_5);
    expect(request.tool_choice).toEqual({ type: 'none' });
    expect(request.tools).toHaveLength(3);
  });

  it('page-tool rules name no language switch and no locale', () => {
    expect(PAGE_TOOL_INSTRUCTIONS).not.toMatch(/switch the language|locale/);
  });
});
