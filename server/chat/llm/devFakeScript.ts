import type { AgentToolCall } from '../../../src/data/chat/contract.js';
import type { FakeScript } from './FakeLlmClient.js';
import { LlmError, type LlmMessage, type LlmRequest } from './LlmClient.js';

const DEV_ANSWER =
  'This is a scripted answer from the fake model (CHAT_FAKE_LLM=1). Andrew is a **Senior Android Engineer** with iOS experience.\n\n- Kotlin, Jetpack Compose\n- Cync and August Home apps';

/** Tool rounds: the sentence before the calls and the answers after the results. */
const DEV_TOOL_TEXT = {
  before: 'Sure, doing it now.',
  ok: 'Done.',
  failed: "That didn't work on this page.",
};

/**
 * Natural commands the fake model turns into tool calls, for trying the widget: the page's example
 * commands, and `apps`, a section the catalogue lacks, which shows the widget's `invalid_params`
 * path.
 */
const DEV_COMMANDS: { pattern: RegExp; name: AgentToolCall['name']; value: string }[] = [
  { pattern: /(show|scroll|go to).*impact/i, name: 'scrollToSection', value: 'impact' },
  { pattern: /(show|scroll|go to).*contacts/i, name: 'scrollToSection', value: 'contacts' },
  { pattern: /(show|scroll|go to).*apps/i, name: 'scrollToSection', value: 'apps' },
  { pattern: /highlight.*transcenda/i, name: 'highlightElement', value: 'experience:transcenda' },
  { pattern: /(open|write|message).*telegram/i, name: 'openContact', value: 'telegram' },
  { pattern: /(open|write|message).*linkedin/i, name: 'openContact', value: 'linkedin' },
];

/** The one parameter of each tool (docs/chat/API.md → Tool catalogue). */
const PARAM_BY_TOOL: Record<AgentToolCall['name'], string> = {
  highlightElement: 'target',
  openContact: 'channel',
  scrollToSection: 'section',
};

/** Splits text into word-sized deltas, like a real stream. */
export function words(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

/** The visitor's text of a message (questions carry `<page_state>` first). */
export function textOf(message: LlmMessage | undefined): string {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content.trim();
  const texts = message.content.filter((block) => block.type === 'text');
  return texts.at(-1)?.text.trim() ?? '';
}

/**
 * Tool calls for a question: `/tool name=value …` (e.g. `/tool scrollToSection=impact
 * openContact=email`; unknown tool names are dropped, values are not checked, so a wrong value
 * shows the widget's `invalid_params` path) or one of `DEV_COMMANDS`.
 */
function toolNamesFor(question: string): { name: string; value: string }[] {
  if (question.startsWith('/tool')) {
    return question
      .slice('/tool'.length)
      .trim()
      .split(/\s+/)
      .filter((part) => part.includes('='))
      .map((part) => {
        const [name = '', value = ''] = part.split('=');
        return { name, value };
      });
  }
  const command = DEV_COMMANDS.find(({ pattern }) => pattern.test(question));
  return command ? [command] : [];
}

function toolCallsFor(request: LlmRequest, question: string): AgentToolCall[] {
  return toolNamesFor(question).flatMap(({ name, value }, index) => {
    const param = PARAM_BY_TOOL[name as AgentToolCall['name']] as string | undefined;
    if (!param) return [];
    const id = `toolu_fake_${request.messages.length}_${index}`;
    return [{ id, name: name as AgentToolCall['name'], input: { [param]: value } }];
  });
}

/** A turn when tools are on: calls for a command, a short answer after the results. */
function toolScript(request: LlmRequest): FakeScript | undefined {
  const text = DEV_TOOL_TEXT;
  const last = request.messages.at(-1);
  if (last && typeof last.content !== 'string' && last.content[0]?.type === 'tool_result') {
    const failed = last.content.some((block) => block.type === 'tool_result' && block.is_error);
    return { deltas: words(failed ? text.failed : text.ok), delayMs: 60 };
  }
  if (request.tool_choice?.type !== 'auto') return undefined;
  const toolCalls = toolCallsFor(request, textOf(last));
  return toolCalls.length > 0 ? { deltas: words(text.before), toolCalls, delayMs: 60 } : undefined;
}

/**
 * Dev-mode script. The last visitor message may start with a command to exercise the widget:
 * `/error` (mid-stream upstream error), `/fail` (upstream error before the stream),
 * `/refusal`, `/long` (`max_tokens`), `/slow` (keeps the stream open, for Stop). `/tool` and the
 * `DEV_COMMANDS` phrases answer with a tool round.
 */
export function devFakeScript(request: LlmRequest): FakeScript {
  const last = textOf(request.messages.at(-1));
  const tools = toolScript(request);
  if (tools) return tools;
  const deltas = words(DEV_ANSWER);
  const upstream = new LlmError('Upstream overloaded_error (fake)', {
    retryable: true,
    errorType: 'overloaded_error',
  });
  const base: FakeScript = { deltas, delayMs: 60 };
  if (last.startsWith('/error')) return { ...base, failAfterDeltas: { count: 5, error: upstream } };
  if (last.startsWith('/fail')) return { ...base, failBeforeStart: upstream };
  if (last.startsWith('/refusal')) return { deltas: [], stopReason: 'refusal' };
  if (last.startsWith('/long')) return { ...base, stopReason: 'max_tokens' };
  if (last.startsWith('/slow')) return { ...base, delayMs: 1_000, hang: true };
  return base;
}
