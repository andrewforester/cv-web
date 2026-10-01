import type { ComponentProps } from 'react';
import { useStrings } from '../../i18n';
import { SendButton as SharedSendButton } from '../../shared/chat/SendButton';
import { chatStrings } from './strings';

type SendButtonProps = Omit<ComponentProps<typeof SharedSendButton>, 'sendLabel' | 'stopLabel'>;

/** The shared Send / Stop button with the chat's labels. */
export function SendButton(props: SendButtonProps) {
  const strings = useStrings(chatStrings);
  return <SharedSendButton {...props} sendLabel={strings.send} stopLabel={strings.stop} />;
}
