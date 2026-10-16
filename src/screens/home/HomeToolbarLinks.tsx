import { useStrings } from '../../i18n';
import { HOME_NAV_LABELS, HOME_NAV_SECTIONS, type HomeNavSection } from './homeNav';
import styles from './HomeToolbar.module.css';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeToolbarLinksProps {
  id: string;
  /** The narrow screen's menu is open (the list shows under the bar). */
  open: boolean;
  activeSection: HomeNavSection | null;
  onSelect: (section: HomeNavSection) => void;
}

/** The section buttons: a row in the bar on a wide screen, the menu's list on a narrow one. */
export function HomeToolbarLinks({ id, open, activeSection, onSelect }: HomeToolbarLinksProps) {
  const strings = useStrings(homeStrings);
  return (
    <div
      id={id}
      className={styles.list}
      data-open={open ? '' : undefined}
      data-testid={homeTestIds.toolbarList}
    >
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
  );
}
