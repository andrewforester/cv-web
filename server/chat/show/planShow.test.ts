import { describe, expect, it } from 'vitest';
import { NARRATE_BODY, replyBody } from '../../test/helpers.js';
import { HAIKU_4_5 } from '../llm/modelOptions.js';
import { NARRATE_DEADLINE_MS, narrationStreamer, planShow } from './planShow.js';

const knowledge = () => Promise.resolve('<knowledge>CV</knowledge>');

describe('planShow', () => {
  it('caps the narrate deadline at 20 s and leaves the reply deadline as is', async () => {
    expect((await planShow(NARRATE_BODY, knowledge, HAIKU_4_5, 55_000)).deadlineMs).toBe(
      NARRATE_DEADLINE_MS,
    );
    expect((await planShow(NARRATE_BODY, knowledge, HAIKU_4_5, 30)).deadlineMs).toBe(30);
    expect((await planShow(replyBody(), knowledge, HAIKU_4_5, 55_000)).deadlineMs).toBe(55_000);
  });

  it('loads the knowledge only for replies', async () => {
    let loads = 0;
    const counting = () => {
      loads++;
      return knowledge();
    };
    const narrate = await planShow(NARRATE_BODY, counting, HAIKU_4_5, 1);
    expect(loads).toBe(0);
    expect(narrate.streamer).toBeDefined();
    const reply = await planShow(replyBody(), counting, HAIKU_4_5, 1);
    expect(loads).toBe(1);
    expect(reply.streamer).toBeUndefined();
  });
});

describe('narrationStreamer', () => {
  it('encodes parsed lines as line events and counts them', () => {
    const streamer = narrationStreamer();
    expect(streamer.text('tokens: Fonts')).toEqual([]);
    expect(streamer.text(' first.\nfinale: Done.')).toEqual([
      'event: line\ndata: {"key":"tokens","text":"Fonts first."}\n\n',
    ]);
    expect(streamer.end('end_turn')).toEqual([
      'event: line\ndata: {"key":"finale","text":"Done."}\n\n',
    ]);
    expect(streamer.logFields()).toEqual({ narrationLines: 2 });
  });
});
