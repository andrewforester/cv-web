import { useCallback, useEffect, useState } from 'react';
import { scrollToTarget } from '../../shared/agentTarget';
import { activeNavSection, type HomeNavSection } from './homeNav';

interface ActiveSection {
  /** The section the visitor is reading; `null` on the header. */
  activeSection: HomeNavSection | null;
  /** Scrolls to a section and marks it at once (the scroll then keeps it marked). */
  goToSection: (section: HomeNavSection) => void;
}

/** Follows the scroll for the toolbar once the page's sections are on the page (`ready`). */
export function useActiveSection(ready: boolean): ActiveSection {
  const [activeSection, setActiveSection] = useState<HomeNavSection | null>(null);

  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setActiveSection(activeNavSection()));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Layout changes without a scroll: images and fonts arriving, the Show case's layers leaving.
    const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    resizes?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      resizes?.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ready]);

  const goToSection = useCallback((section: HomeNavSection) => {
    if (scrollToTarget(`section:${section}`)) setActiveSection(section);
  }, []);

  return { activeSection, goToSection };
}
