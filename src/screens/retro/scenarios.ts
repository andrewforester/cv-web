import type { ShowScenarioId } from '../../data/retro';
import type { ShowSource } from './engine/consolePlan';
import { CV_ANCHORS, CV_COPY, RETRO_SHOW } from './scenario';
import { PROFILE_ANCHORS, PROFILE_COPY, RETRO_NEW_SHOW } from './scenarioNew';
import type { RetroStrings } from './strings';

/** Stable hooks of the page under the show the decorations anchor on (unprefixed selectors). */
export interface DecorationAnchors {
  /** The page's root: the top bar sits on its top, the footer on its bottom. */
  root: string;
  /** The page's header: the note sits under it once the layout is fixed. */
  header: string;
}

/** Which `retroStrings` the decorations show on this page. */
export interface DecorationCopy {
  nav: readonly (keyof RetroStrings)[];
  marquee: keyof RetroStrings;
  webringName: keyof RetroStrings;
}

/** A page's show: what its steps do to that page (docs/retro/ARCHITECTURE.md §10 → Screen). */
export interface RetroShowSource {
  /** Steps (chunks), meta (the manifest's steps), layers, modules. */
  show: ShowSource;
  /** The page under the show: the guards render it, the decorations anchor on it. */
  page: 'cv' | 'profile';
  anchors: DecorationAnchors;
  copy: DecorationCopy;
}

/**
 * Every scenario with its source; `Partial`, so a manifest can land before its source. The shell
 * maps a page to a scenario only together with its source; one without a source ends at once.
 */
export const SHOW_SOURCES: Partial<Record<ShowScenarioId, RetroShowSource>> = {
  'retro-3': { show: RETRO_SHOW, page: 'cv', anchors: CV_ANCHORS, copy: CV_COPY },
  'retro-new-1': {
    show: RETRO_NEW_SHOW,
    page: 'profile',
    anchors: PROFILE_ANCHORS,
    copy: PROFILE_COPY,
  },
};

/** Every registered source with its scenario id (the guards run over each). */
export const registeredSources = (): [ShowScenarioId, RetroShowSource][] =>
  Object.entries(SHOW_SOURCES).flatMap(([id, source]) =>
    source ? [[id as ShowScenarioId, source]] : [],
  );
