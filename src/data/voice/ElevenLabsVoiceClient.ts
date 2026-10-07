// The only importer of `@elevenlabs/*` (lint enforces it). The SDK and `livekit-client` load with
// a dynamic `import()`, so they form a lazy chunk; the two worklets are emitted as same-origin
// assets, so the SDK never falls back to `blob:` scripts and CSP `script-src 'self'` holds.
import type { DisconnectionDetails, VoiceConversation } from '@elevenlabs/client';
import audioConcatProcessorUrl from '@elevenlabs/client/worklets/audioConcatProcessor.js?url&no-inline';
import rawAudioProcessorUrl from '@elevenlabs/client/worklets/rawAudioProcessor.js?url&no-inline';
import { AGENT_TOOL_NAMES, type AgentToolName } from '../chat/contract';
import type { VoiceSessionResponse } from './contract';
import type {
  VoiceCall,
  VoiceCallEvent,
  VoiceCallHandlers,
  VoiceClient,
  VoiceEndReason,
} from './VoiceClient';

/** The part of the SDK this adapter uses; tests pass a stub through the constructor. */
export type ElevenLabsSdk = Pick<typeof import('@elevenlabs/client'), 'Conversation'>;

const loadElevenLabsSdk = (): Promise<ElevenLabsSdk> => import('@elevenlabs/client');

/**
 * `VoiceClient` over ElevenLabs Agents (docs/voice/SYSTEM_DESIGN.md §3–§4, §7): a WebRTC session
 * started with our endpoint's token. SDK callbacks become `VoiceCallEvent`s; each catalogue tool
 * is registered as a client tool whose result the agent reads as JSON (`{"ok":true}`).
 */
export class ElevenLabsVoiceClient implements VoiceClient {
  private readonly loadSdk: () => Promise<ElevenLabsSdk>;
  private sdk: Promise<ElevenLabsSdk> | null = null;
  private toolCalls = 0;

  constructor(loadSdk: () => Promise<ElevenLabsSdk> = loadElevenLabsSdk) {
    this.loadSdk = loadSdk;
  }

  async requestMicrophone(): Promise<'granted' | 'denied'> {
    // Fetch the SDK chunk while the permission prompt is open.
    this.sdkModule().catch(() => undefined);
    const media = globalThis.navigator?.mediaDevices;
    if (!media?.getUserMedia) return 'denied';
    try {
      const stream = await media.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) track.stop();
      return 'granted';
    } catch {
      return 'denied';
    }
  }

  async start(session: VoiceSessionResponse, handlers: VoiceCallHandlers): Promise<VoiceCall> {
    const call = new ElevenLabsCall(handlers);
    call.emit({ type: 'status', status: 'connecting' });
    try {
      const { Conversation } = await this.sdkModule();
      const conversation = await Conversation.startSession({
        conversationToken: session.conversationToken,
        connectionType: 'webrtc',
        textOnly: false,
        workletPaths: {
          rawAudioProcessor: rawAudioProcessorUrl,
          audioConcatProcessor: audioConcatProcessorUrl,
        },
        // Unknown tool names are answered by the SDK with an error at once.
        clientTools: this.clientTools(handlers),
        onConnect: () => call.emit({ type: 'status', status: 'live' }),
        onModeChange: ({ mode }) => call.emit({ type: 'mode', mode }),
        onMessage: ({ role, message, event_id }) =>
          call.emit({
            type: 'line',
            line: {
              id: lineId(role, event_id),
              role: role === 'user' ? 'visitor' : 'agent',
              text: message,
            },
          }),
        onAgentResponseCorrection: ({ event_id, corrected_agent_response }) =>
          call.emit({
            type: 'correction',
            id: lineId('agent', event_id),
            text: corrected_agent_response,
          }),
        onDisconnect: (details) => call.disconnected(details),
      });
      call.attach(conversation);
      return call;
    } catch (error) {
      // The caller ends the call as `error`; nothing more comes from this one.
      call.abandon();
      throw error;
    }
  }

  private sdkModule(): Promise<ElevenLabsSdk> {
    this.sdk ??= this.loadSdk().catch((error: unknown) => {
      this.sdk = null;
      throw error;
    });
    return this.sdk;
  }

  private clientTools(handlers: VoiceCallHandlers) {
    const tools: Record<string, (parameters: unknown) => Promise<string>> = {};
    for (const name of AGENT_TOOL_NAMES) {
      tools[name] = async (parameters) =>
        JSON.stringify(await this.runTool(handlers, name, parameters));
    }
    return tools;
  }

  private runTool(handlers: VoiceCallHandlers, name: AgentToolName, parameters: unknown) {
    this.toolCalls += 1;
    const input = isRecord(parameters) ? parameters : {};
    return handlers.onToolCall({ id: `voice-${this.toolCalls}`, name, input });
  }
}

/** One live call: forwards events until `ended`, which it emits exactly once. */
class ElevenLabsCall implements VoiceCall {
  private readonly handlers: VoiceCallHandlers;
  private conversation: VoiceConversation | null = null;
  private endReason: 'visitor' | 'time_limit' | null = null;
  private done = false;

  constructor(handlers: VoiceCallHandlers) {
    this.handlers = handlers;
  }

  emit(event: VoiceCallEvent): void {
    if (this.done) return;
    if (event.type === 'ended') this.done = true;
    this.handlers.onEvent(event);
  }

  attach(conversation: VoiceConversation): void {
    this.conversation = conversation;
  }

  abandon(): void {
    this.done = true;
  }

  disconnected(details: DisconnectionDetails): void {
    if (details.reason === 'error') {
      this.emit({ type: 'ended', reason: 'error', message: details.message });
      return;
    }
    const reason: VoiceEndReason =
      details.reason === 'agent' ? 'agent' : (this.endReason ?? 'visitor');
    this.emit({ type: 'ended', reason });
  }

  async end(reason: 'visitor' | 'time_limit' = 'visitor'): Promise<void> {
    if (this.done) return;
    this.endReason = reason;
    try {
      await this.conversation?.endSession();
    } finally {
      // The SDK reports `user` through `onDisconnect`; this covers a session already gone.
      this.emit({ type: 'ended', reason });
    }
  }

  levels(): { input: number; output: number } {
    const conversation = this.conversation;
    if (!conversation || this.done) return { input: 0, output: 0 };
    return {
      input: clamp01(conversation.getInputVolume()),
      output: clamp01(conversation.getOutputVolume()),
    };
  }

  setMuted(muted: boolean): void {
    if (!this.done) this.conversation?.setMicMuted(muted);
  }

  sendContextualUpdate(text: string): void {
    if (!this.done) this.conversation?.sendContextualUpdate(text);
  }
}

/** A visitor line and the agent's answer to it can share ElevenLabs' event id: the role keeps ids apart. */
function lineId(role: 'user' | 'agent', eventId: number): string {
  return `${role === 'user' ? 'visitor' : 'agent'}-${eventId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
