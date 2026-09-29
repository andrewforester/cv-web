import { buildAgentToolSpecs } from '../../../src/data/chat/agentTools.js';
import type { Cv } from '../../../src/data/models.js';
import cvEn from '../../../src/data/mock/cv.en.json' with { type: 'json' };
import type { LlmTool } from '../llm/LlmClient.js';

/**
 * The page-agent tools as Anthropic `tools` (docs/chat/API.md → Tool catalogue): built once from
 * the English CV (ids are the same in every locale), so every v2 request sends byte-identical
 * tools at the head of the cached prefix. `confirm` stays client-side.
 */
export const LLM_TOOLS: readonly LlmTool[] = buildAgentToolSpecs(cvEn as Cv).map(
  ({ name, description, inputSchema }) => ({
    name,
    description,
    input_schema: inputSchema,
    strict: true,
  }),
);
