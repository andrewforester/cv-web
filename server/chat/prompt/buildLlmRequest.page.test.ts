import { describe, expect, it } from 'vitest';
import { buildProfileToolSpecs } from '../../../src/data/chat/agentTools.js';
import profileEn from '../../../src/data/mock/profile.en.json' with { type: 'json' };
import type { Profile } from '../../../src/data/profile.js';
import { profileBody, v2Body } from '../../test/helpers.js';
import { HAIKU_4_5 } from '../llm/modelOptions.js';
import type { ValidatedChatV2 } from '../validateParts.js';
import { buildLlmRequest } from './buildLlmRequest.js';
import { LLM_TOOLS, LLM_TOOLS_BY_PAGE } from './llmTools.js';

const validated = (body: ReturnType<typeof v2Body>): ValidatedChatV2 => ({ ...body, toolRound: 0 });

describe('buildLlmRequest: per page', () => {
  it('sends the CV catalogue without a page and on cv: the same request byte for byte', () => {
    const legacy = buildLlmRequest(validated(v2Body()), '<knowledge/>', HAIKU_4_5);
    const cv = buildLlmRequest(validated({ ...v2Body(), page: 'cv' }), '<knowledge/>', HAIKU_4_5);
    expect(JSON.stringify(cv)).toBe(JSON.stringify(legacy));
    expect(legacy.tools).toEqual([...LLM_TOOLS]);
  });

  it("sends /new's catalogue on profile, with the same instruction blocks", () => {
    const legacy = buildLlmRequest(validated(v2Body()), '<knowledge/>', HAIKU_4_5);
    const profile = buildLlmRequest(validated(profileBody()), '<knowledge/>', HAIKU_4_5);
    expect(profile.tools).toEqual([...LLM_TOOLS_BY_PAGE.profile]);
    expect(profile.tools?.map((tool) => tool.name)).toEqual(legacy.tools?.map((t) => t.name));
    expect(profile.system).toEqual(legacy.system);
    expect(profile.tool_choice).toEqual({ type: 'auto' });
  });

  it('builds the /new tools from the profile catalogue as strict tools', () => {
    expect(LLM_TOOLS_BY_PAGE.cv).toBe(LLM_TOOLS);
    expect(LLM_TOOLS_BY_PAGE.profile).toEqual(
      buildProfileToolSpecs(profileEn as Profile).map(({ name, description, inputSchema }) => ({
        name,
        description,
        input_schema: inputSchema,
        strict: true,
      })),
    );
    const openContact = LLM_TOOLS_BY_PAGE.profile.find((tool) => tool.name === 'openContact');
    expect(openContact?.input_schema.properties).toMatchObject({
      channel: { enum: ['email', 'phone'] },
    });
  });
});
