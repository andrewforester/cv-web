import type { RetroStepMeta } from '../../../data/retro';
import type {
  ConsoleLine,
  DamageLayer,
  PlannedEffect,
  PlannedStep,
  RetroEffect,
  RetroStep,
  ShowPlan,
} from './showTypes';

/** How a `loadModule` effect reads in the console: `const { ChatRoute } = await import('./chat');`. */
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
  finaleFallback: string;
}

const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;

export const effectKey = (effect: RetroEffect): string => {
  switch (effect.kind) {
    case 'removeLayer':
      return `layer:${effect.layer}`;
    case 'removeDecoration':
      return `decoration:${effect.decoration}`;
    case 'loadModule':
      return `module:${effect.module}`;
  }
};

/** The custom properties a token layer sets, in file order. */
export function tokenDeclarations(css: string): [name: string, value: string][] {
  return [...css.matchAll(DECLARATION)].map(([, name = '', value = '']) => [
    name,
    value.replace(/\s+/g, ' ').trim(),
  ]);
}

function layerLines(layer: DamageLayer, readToken: TokenReader): ConsoleLine[] {
  const file: ConsoleLine = { kind: 'file', text: `--- layers/${layer.id}.css` };
  if (layer.display === 'rules') {
    const lines = layer.css.split('\n').filter((line) => line.trim() !== '');
    return [file, ...lines.map((text): ConsoleLine => ({ kind: 'del', text }))];
  }
  return [
    file,
    ...tokenDeclarations(layer.css).flatMap(([name, value]): ConsoleLine[] => {
      const live = readToken(name);
      const removed: ConsoleLine = { kind: 'del', text: `${name}: ${value};` };
      // Without a live value, removing the override is the whole change: nothing to print as `+`.
      return live === undefined ? [removed] : [removed, { kind: 'add', text: `${name}: ${live};` }];
    }),
  ];
}

function effectText(
  effect: RetroEffect,
  source: ShowSource,
  readToken: TokenReader,
): Pick<PlannedEffect, 'lines' | 'doneText'> {
  switch (effect.kind) {
    case 'removeLayer': {
      const layer = source.layers[effect.layer];
      if (!layer) throw new Error(`Unknown damage layer: ${effect.layer}`);
      return { lines: layerLines(layer, readToken), doneText: `${layer.id} removed` };
    }
    case 'removeDecoration':
      return {
        lines: [
          { kind: 'code', text: `document.getElementById('${effect.decoration}').remove();` },
        ],
        doneText: `${effect.decoration} removed`,
      };
    case 'loadModule': {
      const module = source.modules[effect.module];
      if (!module) throw new Error(`Unknown show module: ${effect.module}`);
      return {
        lines: [
          {
            kind: 'code',
            text: `const { ${module.exportName} } = await import('${module.path}');`,
          },
        ],
        doneText: `${module.label} loaded`,
      };
    }
  }
}

function planStep(step: RetroStep, source: ShowSource, readToken: TokenReader): PlannedStep {
  const meta = source.meta.find(({ id }) => id === step.id);
  if (!meta) throw new Error(`Step without manifest entry: ${step.id}`);
  let chars = 0;
  const effects = step.effects.map((effect): PlannedEffect => {
    const text = effectText(effect, source, readToken);
    chars += text.lines.reduce((sum, line) => sum + line.text.length, 0);
    return { key: effectKey(effect), effect, ...text, end: chars };
  });
  return {
    id: step.id,
    title: meta.title,
    fallback: meta.fallback,
    fast: step.speed === 'fast',
    effects,
    chars,
  };
}

/**
 * The whole show's console text, generated once at the start from the scenario (code shown = code
 * applied, ARCHITECTURE §2): rule layers verbatim, token layers as a diff against live values.
 */
export function planShow(source: ShowSource, readToken: TokenReader): ShowPlan {
  const steps = source.steps.map((step) => planStep(step, source, readToken));
  const all = steps.flatMap((step) => step.effects.map(({ effect }) => effect));
  return {
    steps,
    finaleFallback: source.finaleFallback,
    layers: all.flatMap((effect) => (effect.kind === 'removeLayer' ? [effect.layer] : [])),
    decorations: all.flatMap((effect) =>
      effect.kind === 'removeDecoration' ? [effect.decoration] : [],
    ),
  };
}
