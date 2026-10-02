import type { ChatErrorCode } from '../../../data/chat';
import type { RetroNarrationKey, RetroStepId, ShowReplyState } from '../../../data/retro';

/** What a chunk does to the page (ARCHITECTURE §2). Ids are the scenario's layer/decoration/module ids. */
export type RetroEffect =
  | { kind: 'removeLayer'; layer: string }
  | { kind: 'removeDecoration'; decoration: string }
  | { kind: 'loadModule'; module: string };

/** One damage layer: a CSS file imported as text; the same string is injected and typed. */
export interface DamageLayer {
  id: string;
  css: string;
  /** `tokens`: `:root` overrides, applied as `style.setProperty` with the live values; `rules`: removed. */
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

/** A custom property the engine sets inline on `<html>` (a token layer's `style.setProperty`). */
export type TokenValue = readonly [name: string, value: string];

/**
 * One row of the DevTools console (SPEC → DevTools console → Messages). `prompt`: the input row the
 * next command types into (with the caret; no lines = empty); `echo`: an input that has run.
 */
export type ConsoleRow =
  | { kind: 'log'; text: string }
  | { kind: 'group'; title: string; collapsed: boolean }
  | { kind: 'prompt'; lines: readonly string[] }
  | { kind: 'echo'; lines: readonly string[] }
  | { kind: 'result'; text: string }
  | { kind: 'done'; text: string }
  | { kind: 'warn'; text: string }
  | { kind: 'end'; text: string };

/** A chunk with the console text that is typed for it, precomputed when the show starts. */
export interface PlannedChunk {
  /** Unique in the show: `<kind>:<id>` of its effect. */
  key: string;
  effect: RetroEffect;
  target: ChunkTarget | null;
  motion: ChunkMotion;
  /** The console input it types, by line: `// → <label>` (when it has a target), then the command. */
  input: readonly string[];
  /** Text of the `✓` line printed when the chunk has applied. */
  doneText: string;
  /** A token layer: the custom properties its `style.setProperty` calls set, in typed order. */
  tokens: readonly TokenValue[];
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
  /** Every damage layer and decoration active at the start (all the steps remove). */
  layers: readonly string[];
  decorations: readonly string[];
}

/** The copy the runner writes into the chat itself (the screen's strings). */
export interface ShowCopy {
  /** The two intro lines before DevTools opens (SPEC → Timeline). */
  introLine: string;
  fixLine: string;
  /** The line after DevTools has collapsed, before the chat does (SPEC → End of the show). */
  closingLine: string;
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

/**
 * Round 5 (ARCHITECTURE §9): the page alone, the chat's two intro lines, DevTools, the steps,
 * `✓ All fixes applied.`, DevTools collapsing, the chat's closing line, the chat collapsing.
 */
export type ShowPhase =
  | 'idle'
  | 'intro'
  | 'handoff'
  | 'console'
  | 'steps'
  | 'finale'
  | 'undock'
  | 'outro'
  | 'closing'
  | 'done';
/**
 * Inside a step: `narrate` (its narration comment types into the console, then a read pause), per
 * chunk `type` (applies at its end) and `beat`, then `stepDone`.
 */
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
  request: { id: number; input: ShowReplyState; text: string } | null;
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
  /** The current step's narration as console comment lines (`// …`), fixed when the step starts. */
  comment: readonly string[];
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
