import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';

/**
 * The mic inside the composer (docs/design/voice/SPEC.md → Layout 1): starts a call from the open
 * chat, in the same place.
 */
export function VoiceComposerMic({ onStart }: { onStart: () => void }) {
  const strings = useStrings(chatStrings);
  return (
    <button
      type="button"
      className={chat.iconButton}
      aria-label={strings.voiceMicLabel}
      data-testid={chatTestIds.voiceComposerMic}
      onClick={onStart}
    >
      <ChatIcon name="mic" />
    </button>
  );
}
