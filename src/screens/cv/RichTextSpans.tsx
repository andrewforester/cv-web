import type { RichText } from '../../data';
import styles from './RichTextSpans.module.css';

interface RichTextSpansProps {
  className?: string;
  text: RichText;
}

/** A line of CV text inline: emphasised fragments (either kind) are set in a heavier weight. */
export function RichTextSpans({ className, text }: RichTextSpansProps) {
  return (
    <span className={className}>
      {text.map((span, index) =>
        span.emphasis ? (
          <strong key={index} className={styles.strong}>
            {span.text}
          </strong>
        ) : (
          span.text
        ),
      )}
    </span>
  );
}
