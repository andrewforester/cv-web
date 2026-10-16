import type { ComponentProps } from 'react';
import { useStrings } from '../../i18n';
import { MessageRow as SharedMessageRow } from '../../shared/chat/MessageRow';
import { chatStrings } from './strings';

type MessageRowProps = Omit<ComponentProps<typeof SharedMessageRow>, 'authorLabel'>;

/** The shared message row with the chat's "You:" / "Assistant:" screen-reader prefixes. */
export function MessageRow(props: MessageRowProps) {
  const strings = useStrings(chatStrings);
  const authorLabel = props.author === 'visitor' ? strings.you : strings.assistant;
  return <SharedMessageRow {...props} authorLabel={authorLabel} />;
}
