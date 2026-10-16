import { useId, useRef } from 'react';
import { useStrings } from '../../i18n';
import { HOME_NAV_LABELS, type HomeNavSection } from './homeNav';
import styles from './HomeToolbar.module.css';
import { HomeToolbarLinks } from './HomeToolbarLinks';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';
import { useToolbarMenu } from './useToolbarMenu';

interface HomeToolbarProps {
  className?: string;
  /** Absent while the page loads: only the handle shows. */
  activeSection?: HomeNavSection | null;
  onSelect?: (section: HomeNavSection) => void;
}

/**
 * The sticky bar on top (docs/design/page-nav): the handle and the page sections; on a narrow
 * screen the section being read and a menu with the sections.
 */
export function HomeToolbar({ className, activeSection = null, onSelect }: HomeToolbarProps) {
  const strings = useStrings(homeStrings);
  const bar = useRef<HTMLElement>(null);
  const listId = useId();
  const { open, toggle, close, toggleRef } = useToolbarMenu(bar);
  const select = (section: HomeNavSection) => {
    close();
    onSelect?.(section);
  };

  return (
    <nav
      ref={bar}
      className={className ? `${styles.root} ${className}` : styles.root}
      aria-label={strings.toolbarLabel}
      data-active={activeSection ? '' : undefined}
      data-testid={homeTestIds.toolbar}
    >
      <span className={styles.handle}>{strings.handle}</span>
      {activeSection && (
        <span className={styles.current} data-testid={homeTestIds.toolbarCurrent}>
          {strings[HOME_NAV_LABELS[activeSection]]}
        </span>
      )}
      {onSelect && (
        <>
          <button
            ref={toggleRef}
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls={listId}
            data-testid={homeTestIds.toolbarMenu}
            onClick={toggle}
          >
            {strings.toolbarMenu}
          </button>
          <HomeToolbarLinks
            id={listId}
            open={open}
            activeSection={activeSection}
            onSelect={select}
          />
        </>
      )}
    </nav>
  );
}
