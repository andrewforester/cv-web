import { useLayoutEffect, useRef, type RefObject } from 'react';
import { playExperience } from './experienceMotion';
import { playHomeIntro } from './homeIntro';
import { playLoop } from './loopMotion';
import { createMotion } from './motionKit';
import { motionAllowed, watchMotionGate } from './motionGate';
import { readMotionTokens } from './motionTokens';
import { trackScroll } from './scrollMotion';
import { playSections, showHighlighted } from './sectionMotion';

/**
 * The CV page's motion, started once the page is `ready`: the intro, the sections' reveals on
 * scroll (shown at once where the page agent highlights), hover effects and the scroll-linked parts.
 * It starts before the first paint (hidden start states never flash) and only where motion is
 * allowed; it stops on unmount, before printing and when the Show case takes the page.
 * Returns the ref for the page's root.
 */
export function useHomeMotion(ready: boolean): RefObject<HTMLDivElement | null> {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!ready || !root || !motionAllowed(root)) return;
    const tokens = readMotionTokens();
    if (!tokens) return;
    const motion = createMotion(tokens);
    motion.onStop(watchMotionGate(root, motion.stop));
    playHomeIntro(motion, root);
    playSections(motion, root);
    playLoop(motion, root);
    playExperience(motion, root);
    showHighlighted(motion, root);
    trackScroll(motion, root);
    return motion.stop;
  }, [ready]);

  return rootRef;
}
