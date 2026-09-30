import type { ChatErrorCode } from '../../../data/chat';
import type { RetroNarrationKey, RetroStepId, ShowReplyInput } from '../../../data/retro';

/** What a chunk does to the page (ARCHITECTURE §2). Ids are the scenario's layer/decoration/module ids. */
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

/**
 * Where a chunk lands, for the console's `// → <label>` line and the screen's highlight and camera:
 * hook selectors resolved under `[data-retro-stage]` (`#<id>` for a decoration), or the whole page.
 */
export interface ChunkTarget {
  label: string;
  selectors: readonly string[] | 'page';
}

/** How a layer's removal lands (SPEC → Transitions): CSS transitions, or a view transition. */
export type LayerMotion = 'fade' | 'morph';
/** A planned chunk's motion: layers fade or morph, decorations leave, the module has none. */
export type ChunkMotion = LayerMotion | 'leave' | 'none';

/** One visible change (ARCHITECTURE §9 → Round 3): one effect, its target and its motion. */
export interface RetroChunk {
  effect: RetroEffect;
  /** `null`: the module chunk (nothing to point at). */
  target: ChunkTarget | null;
  /** Layers only; decorations always leave, modules have none. */
  motion?: LayerMotion;
}

/** A group of chunks under one narration line. */
export interface RetroStep {
  id: RetroStepId;
  chunks: readonly RetroChunk[];
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

/** A chunk with the console text that is typed for it, precomputed when the show starts. */
export interface PlannedChunk {
  /** Unique in the show: `<kind>:<id>` of its effect. */
  key: string;
  effect: RetroEffect;
  target: ChunkTarget | null;
  motion: ChunkMotion;
  /** `// → <label>` (when it has a target), then the code. */
  lines: readonly ConsoleLine[];
  /** Text of the `✓` line printed when the chunk has applied. */
  doneText: string;
  /** Typed characters of the chunk: it applies at the last one. */
  chars: number;
}

export interface PlannedStep {
  id: RetroStepId;
  title: string;
  fallback: string;
  chunks: readonly PlannedChunk[];
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

export type ShowPhase = 'idle' | 'chat' | 'console' | 'steps' | 'finale' | 'closing' | 'done';
/** Inside a step: its narration, then per chunk `type` (applies at its end) and `beat`, then `stepDone`. */
export type StepStage = 'narrate' | 'type' | 'beat' | 'stepDone';
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
  /** Index of the current chunk in the step (`type`/`beat`). */
  chunk: number;
  stage: StepStage;
  stageAt: number;
  /** Show time the screen's camera settled on the current chunk's target (`focusSettled`). */
  focusAt: number | null;
  heldSince: number | null;
  /** Per chunk key: its effect's run. */
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
  | { type: 'focusSettled'; now: number; key: string }
  | { type: 'moduleLoaded'; now: number; key: string }
  | { type: 'effectFailed'; now: number; key: string; reason: string }
  | { type: 'offline'; now: number; offline: boolean };
