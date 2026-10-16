import { useEffect, useRef } from 'react';
import { useStrings } from '../../i18n';
import { HOME_NAV_LABELS, HOME_NAV_SECTIONS, type HomeNavSection } from './homeNav';
import styles from './HomeToolbar.module.css';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeToolbarProps {
  className?: string;
  /** Absent while the page loads: only the handle shows. */
  activeSection?: HomeNavSection | null;
  onSelect?: (section: HomeNavSection) => void;
}

/** The sticky bar on top (docs/design/page-nav): the handle, then the page sections. */
export function HomeToolbar({ className, activeSection, onSelect }: HomeToolbarProps) {
  const strings = useStrings(homeStrings);
  const list = useRef<HTMLDivElement>(null);

  // On a phone the list scrolls sideways: keep the marked section in sight.
  useEffect(() => {
    const element = list.current;
    const active = element?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!element || !active) return;
    const left = active.offsetLeft - (element.clientWidth - active.offsetWidth) / 2;
    element.scrollTo?.({ left, behavior: 'smooth' });
  }, [activeSection]);

  return (
    <nav
      className={className ? `${styles.root} ${className}` : styles.root}
      aria-label={strings.toolbarLabel}
      data-testid={homeTestIds.toolbar}
    >
      <span className={styles.handle}>{strings.handle}</span>
      {onSelect && (
        <div className={styles.list} ref={list}>
          {HOME_NAV_SECTIONS.map((section) => (
            <button
              key={section}
              type="button"
              className={styles.link}
              aria-current={section === activeSection ? 'true' : undefined}
              data-section={section}
              data-testid={homeTestIds.toolbarLink}
              onClick={() => onSelect(section)}
            >
              {strings[HOME_NAV_LABELS[section]]}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
