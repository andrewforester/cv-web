import {
  buildAgentToolSpecs,
  buildCvPageToolSpecs,
  buildProfileToolSpecs,
  type AgentToolSpec,
} from '../../../src/data/chat/agentTools.js';
import type { ChatPage } from '../../../src/data/chat/contract.js';
import type { Cv } from '../../../src/data/models.js';
import cvEn from '../../../src/data/mock/cv.en.json' with { type: 'json' };
import profileEn from '../../../src/data/mock/profile.en.json' with { type: 'json' };
import type { Profile } from '../../../src/data/profile.js';
import { CV_PAGE } from '../cvPageData.js';
import type { LlmTool } from '../llm/LlmClient.js';

function toLlmTools(specs: AgentToolSpec[]): readonly LlmTool[] {
  return specs.map(({ name, description, inputSchema }) => ({
    name,
    description,
    input_schema: inputSchema,
    strict: true,
  }));
}

/**
 * The page-agent tools as Anthropic `tools` (docs/chat/API.md → Tool catalogue): built once from
 * the English CV (ids are the same in every locale), so every v2 request sends byte-identical
 * tools at the head of the cached prefix. `confirm` stays client-side.
 */
export const LLM_TOOLS: readonly LlmTool[] = toLlmTools(buildAgentToolSpecs(cvEn as Cv));

/** Each page's catalogue (API.md → Tool catalogue per page), built once like `LLM_TOOLS`. */
export const LLM_TOOLS_BY_PAGE: Readonly<Record<ChatPage, readonly LlmTool[]>> = {
  cv: LLM_TOOLS,
  profile: toLlmTools(buildProfileToolSpecs(profileEn as Profile)),
};

/** The one page's catalogue (API.md → v4: three tools, 38 targets), built once like `LLM_TOOLS`. */
export const LLM_TOOLS_V4: readonly LlmTool[] = toLlmTools(buildCvPageToolSpecs(CV_PAGE));
