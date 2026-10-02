import type { RetroStepMeta } from '../../../data/retro';
import { LAYER_ATTRIBUTE } from './layerHost';
import type {
  ChunkMotion,
  DamageLayer,
  PlannedChunk,
  PlannedStep,
  RetroChunk,
  RetroEffect,
  RetroStep,
  ShowPlan,
  TokenValue,
} from './showTypes';

/** How a `loadModule` effect reads in the console: `const { ChatRoute } = await import('./chat')`. */
export interface ModuleDisplay {
  exportName: string;
  path: string;
  /** `✓ <label> loaded`. */
  label: string;
}

/** The live value of a design token (from the site's stylesheet), if it has one. */
export type TokenReader = (name: string) => string | undefined;

export interface ShowSource {
  steps: readonly RetroStep[];
  meta: readonly RetroStepMeta[];
  layers: Readonly<Record<string, DamageLayer>>;
  modules: Readonly<Record<string, ModuleDisplay>>;
}

const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;

/** The scenario id of what a chunk changes: its layer, decoration or module. */
export const effectId = (effect: RetroEffect): string => {
  switch (effect.kind) {
    case 'removeLayer':
      return effect.layer;
    case 'removeDecoration':
      return effect.decoration;
    case 'loadModule':
      return effect.module;
  }
};

const KEY_PREFIX: Record<RetroEffect['kind'], string> = {
  removeLayer: 'layer',
  removeDecoration: 'decoration',
  loadModule: 'module',
};

/** A chunk's key, unique in the show: `<layer|decoration|module>:<id>`. */
export const effectKey = (effect: RetroEffect): string =>
  `${KEY_PREFIX[effect.kind]}:${effectId(effect)}`;

/** The custom properties a token layer sets, in file order. */
export function tokenDeclarations(css: string): [name: string, value: string][] {
  return [...css.matchAll(DECLARATION)].map(([, name = '', value = '']) => [
    name,
    value.replace(/\s+/g, ' ').trim(),
  ]);
}

/** A JS string literal: single quotes, or double quotes when the value has a `'` (SPEC). */
export function literal(value: string): string {
  return /['\\\n]/.test(value) ? JSON.stringify(value) : `'${value}'`;
}

/**
 * Characters of narration per console line: the ≈ 55-character DevTools row at 400 px (SPEC →
 * DevTools console → Messages) less the `// ` that makes each line a comment.
 */
export const COMMENT_COLUMNS = 52;

/**
 * A step's narration as console comments (Round 5): wrapped at word boundaries to
 * `COMMENT_COLUMNS`, each line `// …`. A word longer than a line stays whole (the row wraps it).
 */
export function narrationComment(text: string): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > COMMENT_COLUMNS) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.map((part) => `// ${part}`);
}

type EffectText = Pick<PlannedChunk, 'doneText' | 'tokens'> & { command: string[] };

/**
 * A token layer sets today's value of each of its tokens inline (the site's own value, read live),
 * then its `<style>` is inert. A token without a live value has nothing to set: dropping the layer
 * is its whole change, so it isn't typed.
 */
function tokenLayerText(layer: DamageLayer, readToken: TokenReader): EffectText {
  const tokens = tokenDeclarations(layer.css).flatMap(([name]): TokenValue[] => {
    const live = readToken(name);
    return live === undefined ? [] : [[name, live]];
  });
  return {
    command: [
      'const { style } = document.documentElement',
      ...tokens.map(([name, value]) => `style.setProperty(${literal(name)}, ${literal(value)})`),
    ],
    doneText: `${layer.id}: ${tokens.length} ${tokens.length === 1 ? 'token' : 'tokens'} set`,
    tokens,
  };
}

function effectText(effect: RetroEffect, source: ShowSource, readToken: TokenReader): EffectText {
  switch (effect.kind) {
    case 'removeLayer': {
      const layer = source.layers[effect.layer];
      if (!layer) throw new Error(`Unknown damage layer: ${effect.layer}`);
      if (layer.display === 'tokens') return tokenLayerText(layer, readToken);
      const selector = `style[${LAYER_ATTRIBUTE}="${layer.id}"]`;
      return {
        command: [`document.querySelector(${literal(selector)}).remove()`],
        doneText: `${layer.id} removed`,
        tokens: [],
      };
    }
    case 'removeDecoration':
      return {
        command: [`document.getElementById(${literal(effect.decoration)}).remove()`],
        doneText: `#${effect.decoration} removed`,
        tokens: [],
      };
    case 'loadModule': {
      const module = source.modules[effect.module];
      if (!module) throw new Error(`Unknown show module: ${effect.module}`);
      return {
        command: [`const { ${module.exportName} } = await import(${literal(module.path)})`],
        doneText: `${module.label} loaded`,
        tokens: [],
      };
    }
  }
}

function motionOf({ effect, motion }: RetroChunk): ChunkMotion {
  switch (effect.kind) {
    case 'removeLayer':
      return motion ?? 'fade';
    case 'removeDecoration':
      return 'leave';
    case 'loadModule':
      return 'none';
  }
}

function planChunk(chunk: RetroChunk, source: ShowSource, readToken: TokenReader): PlannedChunk {
  const { command, doneText, tokens } = effectText(chunk.effect, source, readToken);
  // The target line is a comment: it names where the change lands and changes nothing itself.
  const input = chunk.target ? [`// → ${chunk.target.label}`, ...command] : command;
  return {
    key: effectKey(chunk.effect),
    effect: chunk.effect,
    target: chunk.target,
    motion: motionOf(chunk),
    input,
    doneText,
    tokens,
    chars: input.reduce((sum, line) => sum + line.length, 0),
  };
}

function planStep(step: RetroStep, source: ShowSource, readToken: TokenReader): PlannedStep {
  const meta = source.meta.find(({ id }) => id === step.id);
  if (!meta) throw new Error(`Step without manifest entry: ${step.id}`);
  return {
    id: step.id,
    title: meta.title,
    fallback: meta.fallback,
    chunks: step.chunks.map((chunk) => planChunk(chunk, source, readToken)),
  };
}

/**
 * The whole show's console input, generated once at the start from the scenario (code shown = code
 * applied, ARCHITECTURE §2): one DevTools command per chunk, token values read live.
 */
export function planShow(source: ShowSource, readToken: TokenReader): ShowPlan {
  const steps = source.steps.map((step) => planStep(step, source, readToken));
  const all = steps.flatMap((step) => step.chunks.map(({ effect }) => effect));
  return {
    steps,
    layers: all.flatMap((effect) => (effect.kind === 'removeLayer' ? [effect.layer] : [])),
    decorations: all.flatMap((effect) =>
      effect.kind === 'removeDecoration' ? [effect.decoration] : [],
    ),
  };
}
