import { buildCvPageToolSpecs, type AgentToolSpec } from '../../../src/data/chat/agentTools.js';
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
 * The page-agent tools as Anthropic `tools` (docs/chat/API.md → v4: three tools, 38 targets):
 * built once from the one page, so every request sends byte-identical tools at the head of the
 * cached prefix. `confirm` stays client-side.
 */
export const LLM_TOOLS_V4: readonly LlmTool[] = toLlmTools(buildCvPageToolSpecs(CV_PAGE));
