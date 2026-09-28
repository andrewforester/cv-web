import type { RichText } from '../../data';
import styles from './RichTextLine.module.css';

interface RichTextLineProps {
  className?: string;
  text: RichText;
}

/** One line of CV text with its emphasised fragments. */
export function RichTextLine({ className, text }: RichTextLineProps) {
  return (
    <p className={className}>
      {text.map((span, index) =>
        span.emphasis ? (
          <strong key={index} className={styles[span.emphasis]}>
            {span.text}
          </strong>
        ) : (
          span.text
        ),
      )}
    </p>
  );
}
