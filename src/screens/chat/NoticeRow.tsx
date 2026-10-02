import type { ComponentProps } from 'react';
import { useStrings } from '../../i18n';
import { NoticeRow as SharedNoticeRow } from '../../shared/chat/NoticeRow';
import { chatStrings } from './strings';

type NoticeRowProps = Omit<ComponentProps<typeof SharedNoticeRow>, 'assistantLabel'>;

export type { NoticeAction } from '../../shared/chat/NoticeRow';

/** The shared notice row with the chat's "Assistant:" prefix. */
export function NoticeRow(props: NoticeRowProps) {
  const strings = useStrings(chatStrings);
  return <SharedNoticeRow {...props} assistantLabel={strings.assistant} />;
}
