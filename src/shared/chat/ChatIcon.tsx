import type { CSSProperties } from 'react';
import chat from './assets/chat_icon_chat.svg';
import close from './assets/chat_icon_close.svg';
import send from './assets/chat_icon_send.svg';
import sparkle from './assets/chat_icon_sparkle.svg';
import stop from './assets/chat_icon_stop.svg';
import styles from './ChatIcon.module.css';

const ICONS = { chat, close, send, sparkle, stop } as const;

export type ChatIconName = keyof typeof ICONS;

interface ChatIconProps {
  className?: string;
  name: ChatIconName;
}

/** Decorative icon from `assets/chat_icon_*.svg` in `currentColor`; size it with `className`. */
export function ChatIcon({ className, name }: ChatIconProps) {
  const style = { '--chat-icon-src': `url(${JSON.stringify(ICONS[name])})` } as CSSProperties;
  return (
    <span
      className={className ? `${styles.icon} ${className}` : styles.icon}
      style={style}
      aria-hidden="true"
    />
  );
}
