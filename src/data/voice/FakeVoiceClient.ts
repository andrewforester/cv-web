import type { AgentToolCall } from '../chat/contract';
import type { VoiceSessionResponse } from './contract';
import type { VoiceCall, VoiceCallEvent, VoiceCallHandlers, VoiceClient } from './VoiceClient';

/** One step of a scripted call: an event, or a page tool call the script waits for. */
export type FakeVoiceStep = { event: VoiceCallEvent } | { tool: Omit<AgentToolCall, 'id'> };

const GREETING =
  'Hi, I’m the voice assistant on Andrew’s CV. Ask me about his experience, or ask me to show something on the page.';
const ANSWER =
  'Here is his selected impact, the work he is proudest of. Let me walk you through each card in turn.';

/**
 * Greeting, a visitor line, a scroll, an answer the visitor interrupts (so it gets a correction),
 * goodbye, and the agent hangs up (docs/voice/SYSTEM_DESIGN.md §3).
 */
export const FAKE_VOICE_SCRIPT: readonly FakeVoiceStep[] = [
  { event: { type: 'status', status: 'live' } },
  { event: { type: 'mode', mode: 'speaking' } },
  { event: { type: 'line', line: { id: 'agent-1', role: 'agent', text: GREETING } } },
  { event: { type: 'mode', mode: 'listening' } },
  {
    event: {
      type: 'line',
      line: { id: 'visitor-2', role: 'visitor', text: 'Show me his selected impact.' },
    },
  },
  { event: { type: 'mode', mode: 'speaking' } },
  { tool: { name: 'scrollToSection', input: { section: 'impact' } } },
  { event: { type: 'line', line: { id: 'agent-2', role: 'agent', text: ANSWER } } },
  { event: { type: 'mode', mode: 'listening' } },
  { event: { type: 'correction', id: 'agent-2', text: 'Here is his selected impact.' } },
  {
    event: { type: 'line', line: { id: 'visitor-3', role: 'visitor', text: 'Thanks, bye!' } },
  },
  { event: { type: 'mode', mode: 'speaking' } },
  { event: { type: 'line', line: { id: 'agent-3', role: 'agent', text: 'Goodbye!' } } },
  { event: { type: 'ended', reason: 'agent' } },
];

export interface FakeVoiceClientOptions {
  /** Delay before each step, ms (default 1500: slow enough to watch and screenshot). */
  stepMs?: number;
  microphone?: 'granted' | 'denied';
  /** `start()` rejects after one step, like a failed connection or a busy agent. */
  failStart?: boolean;
  script?: readonly FakeVoiceStep[];
  /** Steps played over and over after `script` until the call ends (line ids get a round suffix). */
  loop?: readonly FakeVoiceStep[];
}

/**
 * Scripted `VoiceClient` for unit tests, e2e and `?voice=fake`: no network, no microphone, no SDK.
 * Every started call is kept in `calls`, so tests can check mute and contextual updates.
 */
export class FakeVoiceClient implements VoiceClient {
  readonly calls: FakeVoiceCall[] = [];
  private readonly options: Required<FakeVoiceClientOptions>;

  constructor(options: FakeVoiceClientOptions = {}) {
    this.options = {
      stepMs: 1500,
      microphone: 'granted',
      failStart: false,
      script: FAKE_VOICE_SCRIPT,
      loop: [],
      ...options,
    };
  }

  requestMicrophone(): Promise<'granted' | 'denied'> {
    return Promise.resolve(this.options.microphone);
  }

  async start(_session: VoiceSessionResponse, handlers: VoiceCallHandlers): Promise<VoiceCall> {
    handlers.onEvent({ type: 'status', status: 'connecting' });
    if (this.options.failStart) {
      await delay(this.options.stepMs);
      throw new Error('FakeVoiceClient: start failed');
    }
    const { script, loop, stepMs } = this.options;
    const call = new FakeVoiceCall(handlers, script, stepMs, loop);
    this.calls.push(call);
    return call;
  }
}

export class FakeVoiceCall implements VoiceCall {
  muted = false;
  readonly contextualUpdates: string[] = [];
  private readonly handlers: VoiceCallHandlers;
  private mode: 'listening' | 'speaking' = 'listening';
  private done = false;
  private toolCalls = 0;

  constructor(
    handlers: VoiceCallHandlers,
    script: readonly FakeVoiceStep[],
    stepMs: number,
    loop: readonly FakeVoiceStep[] = [],
  ) {
    this.handlers = handlers;
    void this.playAll(script, loop, stepMs);
  }

  end(reason: 'visitor' | 'time_limit' = 'visitor'): Promise<void> {
    this.emit({ type: 'ended', reason });
    return Promise.resolve();
  }

  levels(): { input: number; output: number } {
    if (this.done) return { input: 0, output: 0 };
    if (this.mode === 'speaking') return { input: 0, output: 0.6 };
    return { input: this.muted ? 0 : 0.35, output: 0 };
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  sendContextualUpdate(text: string): void {
    this.contextualUpdates.push(text);
  }

  private async playAll(
    script: readonly FakeVoiceStep[],
    loop: readonly FakeVoiceStep[],
    stepMs: number,
  ): Promise<void> {
    await this.play(script, stepMs);
    for (let round = 1; loop.length > 0 && !this.done; round += 1) {
      await this.play(
        loop.map((step) => inRound(step, round)),
        stepMs,
      );
    }
  }

  private async play(script: readonly FakeVoiceStep[], stepMs: number): Promise<void> {
    for (const step of script) {
      await delay(stepMs);
      if (this.done) return;
      if ('tool' in step) {
        this.toolCalls += 1;
        await this.handlers.onToolCall({ id: `voice-${this.toolCalls}`, ...step.tool });
      } else {
        this.emit(step.event);
      }
    }
  }

  private emit(event: VoiceCallEvent): void {
    if (this.done) return;
    if (event.type === 'mode') this.mode = event.mode;
    if (event.type === 'ended') this.done = true;
    this.handlers.onEvent(event);
  }
}

/** A looped step with its line ids made unique for this round. */
function inRound(step: FakeVoiceStep, round: number): FakeVoiceStep {
  if ('tool' in step) return step;
  const { event } = step;
  if (event.type === 'line') {
    return { event: { ...event, line: { ...event.line, id: `${event.line.id}-r${round}` } } };
  }
  if (event.type === 'correction') return { event: { ...event, id: `${event.id}-r${round}` } };
  return step;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
