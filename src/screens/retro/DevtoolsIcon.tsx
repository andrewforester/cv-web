import type { CSSProperties } from 'react';
import clear from './assets/retro_devtools_clear.svg';
import error from './assets/retro_devtools_error.svg';
import eye from './assets/retro_devtools_eye.svg';
import gear from './assets/retro_devtools_gear.svg';
import inspect from './assets/retro_devtools_inspect.svg';
import kebab from './assets/retro_devtools_kebab.svg';
import more from './assets/retro_devtools_more.svg';
import prompt from './assets/retro_devtools_prompt.svg';
import result from './assets/retro_devtools_result.svg';
import triangle from './assets/retro_devtools_triangle.svg';
import warning from './assets/retro_devtools_warning.svg';
import styles from './DevtoolsIcon.module.css';

const ICONS = {
  clear,
  error,
  eye,
  gear,
  inspect,
  kebab,
  more,
  prompt,
  result,
  triangle,
  warning,
} as const;

export type DevtoolsIconName = keyof typeof ICONS;

interface DevtoolsIconProps {
  className?: string;
  name: DevtoolsIconName;
}

/** Decorative DevTools icon from `assets/retro_devtools_*.svg` in `currentColor`. */
export function DevtoolsIcon({ className, name }: DevtoolsIconProps) {
  const style = { '--devtools-icon-src': `url(${JSON.stringify(ICONS[name])})` } as CSSProperties;
  return (
    <span
      className={className ? `${styles.icon} ${className}` : styles.icon}
      style={style}
      aria-hidden="true"
    />
  );
}
