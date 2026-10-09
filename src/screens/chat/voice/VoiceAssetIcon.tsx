import type { CSSProperties } from 'react';
import icon from '../../../shared/chat/ChatIcon.module.css';
import call from './assets/chat_voice_icon_call.svg';
import minimize from './assets/chat_voice_icon_minimize.svg';

// TODO(theme): both join the shared chat icons as `chat_icon_call.svg` / `chat_icon_minimize.svg`
// (`ChatIcon` names `call`, `minimize`; docs/design/voice/SPEC.md → Icons). Until then they are
// this screen's assets on `ChatIcon`'s mask.
const ICONS = { call, minimize } as const;

interface VoiceAssetIconProps {
  className?: string;
  name: keyof typeof ICONS;
}

/** A voice icon from `assets/` in `currentColor`, the shared `ChatIcon` look; size it by class. */
export function VoiceAssetIcon({ className, name }: VoiceAssetIconProps) {
  const style = { '--chat-icon-src': `url(${JSON.stringify(ICONS[name])})` } as CSSProperties;
  return (
    <span
      className={className ? `${icon.icon} ${className}` : icon.icon}
      style={style}
      aria-hidden="true"
    />
  );
}
