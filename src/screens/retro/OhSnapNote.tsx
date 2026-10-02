import { useStrings } from '../../i18n';
import styles from './Decorations.module.css';
import { retroStrings } from './strings';

/** The yellow sticky note complaining about the images that didn't load. */
export function OhSnapNote() {
  const strings = useStrings(retroStrings);
  return (
    <>
      <strong className={styles.noteTitle}>{strings.noteTitle}</strong>
      {strings.noteBody}
    </>
  );
}
