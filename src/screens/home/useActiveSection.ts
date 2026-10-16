import { useCallback, useEffect, useRef, useState } from 'react';
import { scrollToTarget } from '../../shared/agentTarget';
import { activeNavSection, type HomeNavSection } from './homeNav';

/** How long a pick holds the mark when no `scrollend` comes (no scroll needed, older browsers). */
const PICK_HOLD_MS = 1500;

interface ActiveSection {
  /** The section the visitor is reading; `null` on the header. */
  activeSection: HomeNavSection | null;
  /** Scrolls to a section and keeps it marked until the scroll ends. */
  goToSection: (section: HomeNavSection) => void;
}

/** Follows the scroll for the toolbar once the page's sections are on the page (`ready`). */
export function useActiveSection(ready: boolean): ActiveSection {
  const [activeSection, setActiveSection] = useState<HomeNavSection | null>(null);
  // While a picked section is being scrolled to, the sections passed on the way are not marked.
  const picking = useRef(false);
  const onPick = useRef<() => void>(() => {});

  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    let hold = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActiveSection(activeNavSection()));
    };
    const update = () => {
      if (!picking.current) measure();
    };
    // A measure queued before the pick would mark a section the page is leaving.
    onPick.current = () => {
      cancelAnimationFrame(frame);
      clearTimeout(hold);
      hold = window.setTimeout(end, PICK_HOLD_MS);
    };
    const end = () => {
      clearTimeout(hold);
      picking.current = false;
      measure();
    };
    measure();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scrollend', end);
    window.addEventListener('resize', update);
    // Layout changes without a scroll: images and fonts arriving, the Show case's layers leaving.
    const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resizes?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(hold);
      resizes?.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('scrollend', end);
      window.removeEventListener('resize', update);
    };
  }, [ready]);

  const goToSection = useCallback((section: HomeNavSection) => {
    if (!scrollToTarget(`section:${section}`)) return;
    picking.current = true;
    onPick.current();
    setActiveSection(section);
  }, []);

  return { activeSection, goToSection };
}
