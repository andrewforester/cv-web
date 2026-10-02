import { Fragment } from 'react';
import { classNames } from './classNames';
import { GradientText } from './GradientText';
import styles from './Hero.module.css';
import { forestTestIds } from './testIds';

/** A run of the headline; `accent` runs are set in the text gradient. */
export interface HeroHeadlinePart {
  text: string;
  accent?: boolean;
}

interface HeroProps {
  className?: string;
  name: string;
  /** The h1; a gradient full stop is appended. */
  headline: HeroHeadlinePart[];
  subtitle: string;
  photoSrc?: string;
  photoAlt?: string;
}

/** Name, the big headline with its gradient accents, the subtitle and the round photo. */
export function Hero({ className, name, headline, subtitle, photoSrc, photoAlt = '' }: HeroProps) {
  return (
    <div className={classNames(styles.root, className)} data-testid={forestTestIds.hero}>
      <div className={styles.text}>
        <p className={styles.name} data-testid={forestTestIds.name}>
          {name}
        </p>
        <h1 className={styles.headline} data-testid={forestTestIds.headline}>
          {headline.map((part, index) => (
            <Fragment key={index}>
              {part.accent ? <GradientText>{part.text}</GradientText> : part.text}
            </Fragment>
          ))}
          <GradientText>.</GradientText>
        </h1>
        <p className={styles.subtitle} data-testid={forestTestIds.subtitle}>
          {subtitle}
        </p>
      </div>
      {photoSrc && (
        <img
          className={styles.photo}
          src={photoSrc}
          alt={photoAlt}
          data-testid={forestTestIds.photo}
        />
      )}
    </div>
  );
}
