import type { CSSProperties } from 'react';
import alert from './assets/chat_icon_alert.svg';
import chat from './assets/chat_icon_chat.svg';
import close from './assets/chat_icon_close.svg';
import end from './assets/chat_icon_end.svg';
import mic from './assets/chat_icon_mic.svg';
import micOff from './assets/chat_icon_mic_off.svg';
import offline from './assets/chat_icon_offline.svg';
import send from './assets/chat_icon_send.svg';
import sparkle from './assets/chat_icon_sparkle.svg';
import stop from './assets/chat_icon_stop.svg';
import timer from './assets/chat_icon_timer.svg';
import styles from './ChatIcon.module.css';

const ICONS = {
  alert,
  chat,
  close,
  end,
  mic,
  micOff,
  offline,
  send,
  sparkle,
  stop,
  timer,
} as const;

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
