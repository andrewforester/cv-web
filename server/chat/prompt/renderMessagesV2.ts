import type {
  AgentPageStateV4,
  AgentToolResult,
  AgentToolResultItem,
  ChatMessageV4,
  ChatVoiceCallV4,
} from '../../../src/data/chat/contract.js';
import type { LlmAssistantBlock, LlmContentBlock, LlmMessage } from '../llm/LlmClient.js';
import { rebuildAssistantTurn } from '../providerState.js';

/** The page snapshot as a data block in front of the question (docs/chat/AGENT.md §3). */
export function pageStateBlock(page: AgentPageStateV4): string {
  return `<page_state>${JSON.stringify(page)}</page_state>`;
}

/**
 * A voice call's transcript as a data block in front of the question (docs/chat/API.md → Voice
 * calls in the history). `<` is escaped (`\u003c`, still valid JSON) so a line can't close it.
 */
export function voiceCallBlock(call: ChatVoiceCallV4): string {
  const json = JSON.stringify({ lines: call.lines }).replaceAll('<', '\\u003c');
  return `<voice_call>${json}</voice_call>`;
}

/** A call the server did not stream (over the per-response cap) answers like the client would. */
const NOT_RUN: AgentToolResult = { ok: false, error: 'invalid_params' };

/** One `tool_result` per `tool_use` of the assistant turn, in the turn's order. */
function toolResultBlocks(
  assistant: LlmAssistantBlock[],
  results: AgentToolResultItem[],
): LlmContentBlock[] {
  const byId = new Map(results.map((item) => [item.callId, item.result]));
  return assistant.flatMap((block): LlmContentBlock[] => {
    if (block.type !== 'tool_use') return [];
    const result = byId.get(block.id) ?? NOT_RUN;
    return [
      {
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
        ...(result.ok ? {} : { is_error: true }),
      },
    ];
  });
}

/**
 * Validated v4 messages (the tool dialect) as model messages: questions carry their
 * `<voice_call>` blocks, `<page_state>` and text; tool-use turns are rebuilt from
 * `providerState`; results become `tool_result` blocks. Append-only: an earlier
 * message always renders the same, so the conversation prefix stays cacheable.
 */
export function renderMessagesV2(messages: ChatMessageV4[]): LlmMessage[] {
  let lastAssistant: LlmAssistantBlock[] = [];
  return messages.map((message): LlmMessage => {
    if (message.role === 'assistant') {
      if (!message.toolCalls) {
        lastAssistant = [];
        return { role: 'assistant', content: message.content };
      }
      const rebuilt = rebuildAssistantTurn(
        message.content,
        message.toolCalls,
        message.providerState,
      );
      // Validation already rebuilt it once; a failure here is a programming error.
      if (!rebuilt.ok) throw new Error(rebuilt.reason);
      lastAssistant = rebuilt.blocks;
      return { role: 'assistant', content: rebuilt.blocks };
    }
    if ('toolResults' in message) {
      return { role: 'user', content: toolResultBlocks(lastAssistant, message.toolResults) };
    }
    return {
      role: 'user',
      content: [
        ...(message.voiceCalls ?? []).map((call): LlmContentBlock => ({
          type: 'text',
          text: voiceCallBlock(call),
        })),
        { type: 'text', text: pageStateBlock(message.page) },
        { type: 'text', text: message.content },
      ],
    };
  });
}
