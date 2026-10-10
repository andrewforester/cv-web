import { useStrings } from '../../../i18n';
import { ActionChip } from '../ActionChip';
import { MessageRow } from '../MessageRow';
import roundStyles from '../RoundView.module.css';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import type { ChatVoiceAction, ChatVoiceCall, ChatVoiceItem, ChatVoiceLine } from './callReducer';
import { callEndText } from './callEndText';
import { VoiceCallDivider } from './VoiceCallDivider';

/** Lines one by one; consecutive chips share one row, as in a text turn's tool round. */
function groupItems(items: readonly ChatVoiceItem[]): (ChatVoiceLine | ChatVoiceAction[])[] {
  const groups: (ChatVoiceLine | ChatVoiceAction[])[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (item.kind === 'line') groups.push(item);
    else if (Array.isArray(last)) last.push(item);
    else groups.push([item]);
  }
  return groups;
}

/** A voice call in the chat (SPEC → Layout 7): its lines and chips between two call dividers. */
export function VoiceCallView({ call }: { call: ChatVoiceCall }) {
  const strings = useStrings(chatStrings);
  return (
    <>
      <VoiceCallDivider text={strings.voiceCallStarted} withIcon />
      {groupItems(call.items).map((group) =>
        Array.isArray(group) ? (
          <li key={group[0]?.action.call.id} className={roundStyles.actions}>
            {group.map(({ action }) => (
              <ActionChip key={action.call.id} action={action} />
            ))}
          </li>
        ) : (
          <MessageRow
            key={group.id}
            author={group.role === 'visitor' ? 'visitor' : 'assistant'}
            testId={
              group.role === 'visitor' ? chatTestIds.visitorMessage : chatTestIds.assistantMessage
            }
          >
            {group.text}
          </MessageRow>
        ),
      )}
      {call.status === 'ended' && <VoiceCallDivider text={callEndText(call, strings)} />}
    </>
  );
}
