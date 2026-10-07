import { buildCvPageToolSpecs, type AgentToolSpec } from '../../src/data/chat/agentTools.js';
import type { CvPage } from '../../src/data/cvPage.js';
import { VOICE_MAX_CALL_SECONDS } from '../../src/data/voice/contract.js';
import type { ClientToolConfig } from './ElevenLabsApi.js';
import { buildVoicePrompt, VOICE_PROMPT_VERSION } from './prompt/voicePrompt.js';

/** English; the agent switches language once the visitor speaks (§6). */
export const VOICE_FIRST_MESSAGE =
  "Hi, I'm the voice assistant on Andrew's CV. Ask me about his experience, or ask me to show something on the page.";

/** How long the agent waits for a tool's result; `openContact` may wait for a tap (§7). */
const RESPONSE_TIMEOUT_SECS = 5;
const CONFIRM_RESPONSE_TIMEOUT_SECS = 40;

/** Everything of the agent the code owns (ADR-0008 → Decision 4). */
export interface VoiceAgentConfig {
  /** `VOICE_PROMPT_VERSION`: logged with the sync, never sent to ElevenLabs. */
  promptVersion: string;
  prompt: string;
  firstMessage: string;
  maxDurationSeconds: number;
  tools: ClientToolConfig[];
}

/** One catalogue tool as an ElevenLabs client tool: same name, description and enums. */
export function toClientTool(spec: AgentToolSpec): ClientToolConfig {
  const { properties, required } = spec.inputSchema;
  return {
    type: 'client',
    name: spec.name,
    description: spec.description,
    parameters: {
      type: 'object',
      required: [...required],
      properties: Object.fromEntries(
        Object.entries(properties).map(([name, param]) => [
          name,
          { type: param.type, description: param.description, enum: [...param.enum] },
        ]),
      ),
    },
    expects_response: true,
    response_timeout_secs: spec.confirm ? CONFIRM_RESPONSE_TIMEOUT_SECS : RESPONSE_TIMEOUT_SECS,
    execution_mode: 'immediate',
    pre_tool_speech: 'auto',
    interruption_mode: 'allow',
  };
}

/** The agent as this deployment wants it: built from the one page, deterministic. */
export function buildVoiceAgentConfig(knowledge: string, page: CvPage): VoiceAgentConfig {
  return {
    promptVersion: VOICE_PROMPT_VERSION,
    prompt: buildVoicePrompt(knowledge),
    firstMessage: VOICE_FIRST_MESSAGE,
    maxDurationSeconds: VOICE_MAX_CALL_SECONDS,
    tools: buildCvPageToolSpecs(page).map(toClientTool),
  };
}
