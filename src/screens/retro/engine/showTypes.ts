import type { ChatErrorCode } from '../../../data/chat';
import type { RetroNarrationKey, RetroStepId, ShowReplyInput } from '../../../data/retro';

/** What a step does to the page (ARCHITECTURE §2). Ids are the scenario's layer/decoration/module ids. */
export type RetroEffect =
  | { kind: 'removeLayer'; layer: string }
  | { kind: 'removeDecoration'; decoration: string }
  | { kind: 'loadModule'; module: string };

/** One damage layer: a CSS file imported as text; the same string is injected and typed. */
export interface DamageLayer {
  id: string;
  css: string;
  /** `tokens`: `:root` overrides, shown as a diff against the live values; `rules`: shown verbatim. */
  display: 'rules' | 'tokens';
}

export interface RetroStep {
  id: RetroStepId;
  effects: readonly RetroEffect[];
  speed?: 'normal' | 'fast';
}

export type ConsoleLineKind =
  | 'prompt'
  | 'comment'
  | 'file'
  | 'del'
  | 'add'
  | 'code'
  | 'effectDone'
  | 'stepDone'
  | 'skipped'
  | 'end';

export interface ConsoleLine {
  kind: ConsoleLineKind;
  text: string;
}

/** An effect with the console text that is typed for it, precomputed when the show starts. */
export interface PlannedEffect {
  /** Unique in the show: `<kind>:<id>`. */
  key: string;
  effect: RetroEffect;
  lines: readonly ConsoleLine[];
  /** Text of the `✓` line printed when the effect has applied. */
  doneText: string;
  /** Offset in the step's typed characters where this effect's text ends: it applies there. */
  end: number;
}

export interface PlannedStep {
  id: RetroStepId;
  title: string;
  fallback: string;
  fast: boolean;
  effects: readonly PlannedEffect[];
  /** Typed characters of the whole step. */
  chars: number;
}

export interface ShowPlan {
  steps: readonly PlannedStep[];
  finaleFallback: string;
  /** Every damage layer and decoration active at the start (all the steps remove). */
  layers: readonly string[];
  decorations: readonly string[];
}

/** The copy the runner writes into the chat itself (the screen's strings). */
export interface ShowCopy {
  systemJoin: string;
  systemJoined: string;
  greeting: string;
  handoff: string;
  scriptedReply: string;
  tooLong: string;
  offline: string;
}

export interface ShowConfig {
  plan: ShowPlan;
  copy: ShowCopy;
  reducedMotion: boolean;
  /** `false`: narration and replies are scripted from the start (e.g. automation). */
  llm: boolean;
}

export type ShowPhase = 'idle' | 'chat' | 'console' | 'steps' | 'finale' | 'done';
export type StepStage = 'narrate' | 'type' | 'settle';
export type EffectStatus = 'pending' | 'running' | 'applied' | 'skipped';

export interface EffectRun {
  status: EffectStatus;
  /** Show time of the last status change. */
  at: number;
  reason?: string;
}

export interface ChatEntry {
  id: number;
  kind: 'system' | 'agent' | 'visitor';
  text: string;
  /** Wall-clock ms, for the `[HH:MM]` stamp. */
  wallAt: number;
  /** Show time a scripted line starts revealing; `null` = shown as is (streamed, visitor, system). */
  revealFrom: number | null;
}

export interface VisitorState {
  composing: boolean;
  sent: number;
  failuresInRow: number;
  /** Replies stay scripted for the rest of the show. */
  scripted: boolean;
  offline: boolean;
  /** The reply being requested; the state holder streams it while this is set. */
  request: { id: number; input: ShowReplyInput; text: string } | null;
  replyEntry: number | null;
  exchanges: readonly { visitor: string; reply: string }[];
}

export interface ShowState {
  config: ShowConfig;
  /** Show time in ms: advances with the clock, frozen while the tab is hidden. */
  t: number;
  /** Clock reading of the last event. */
  now: number;
  hidden: boolean;
  phase: ShowPhase;
  /** Show time when the current non-step phase ends. */
  phaseEndsAt: number;
  step: number;
  stage: StepStage;
  stageAt: number;
  heldSince: number | null;
  effects: Readonly<Record<string, EffectRun>>;
  chat: readonly ChatEntry[];
  nextId: number;
  narration: Partial<Record<RetroNarrationKey, string>>;
  visitor: VisitorState;
}

export type ShowEvent =
  | { type: 'tick'; now: number }
  | { type: 'visibility'; now: number; hidden: boolean }
  | { type: 'composing'; now: number; on: boolean }
  | { type: 'visitorSent'; now: number; text: string }
  | { type: 'narrationLine'; now: number; key: RetroNarrationKey; text: string }
  | { type: 'replyDelta'; now: number; text: string }
  | { type: 'replyEnded'; now: number }
  | { type: 'replyFailed'; now: number; code: ChatErrorCode }
  | { type: 'moduleLoaded'; now: number; key: string }
  | { type: 'effectFailed'; now: number; key: string; reason: string }
  | { type: 'offline'; now: number; offline: boolean };
