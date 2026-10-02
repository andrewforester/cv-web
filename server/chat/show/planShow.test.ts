import { describe, expect, it } from 'vitest';
import type { ChatPage } from '../../../src/data/chat/contract.js';
import { RETRO_NEW_SCENARIO_ID } from '../../../src/data/retro/scenarioNew.js';
import { SHOW_SCENARIOS } from '../../../src/data/retro/scenarios.js';
import { NARRATE_BODY, replyBody } from '../../test/helpers.js';
import { HAIKU_4_5 } from '../llm/modelOptions.js';
import { NARRATE_DEADLINE_MS, narrationStreamer, planShow } from './planShow.js';
import { showOutline } from './showPrompt.js';

const knowledge = () => Promise.resolve('<knowledge>CV</knowledge>');

describe('planShow', () => {
  it('caps the narrate deadline at 20 s and leaves the reply deadline as is', async () => {
    expect((await planShow(NARRATE_BODY, knowledge, HAIKU_4_5, 55_000)).deadlineMs).toBe(
      NARRATE_DEADLINE_MS,
    );
    expect((await planShow(NARRATE_BODY, knowledge, HAIKU_4_5, 30)).deadlineMs).toBe(30);
    expect((await planShow(replyBody(), knowledge, HAIKU_4_5, 55_000)).deadlineMs).toBe(55_000);
  });

  it("plans from the request's scenario and logs its id", async () => {
    const outline = showOutline(SHOW_SCENARIOS[NARRATE_BODY.scenario]);
    const narrate = await planShow(NARRATE_BODY, knowledge, HAIKU_4_5, 1);
    expect(narrate.llmRequest.system[1]?.text).toBe(outline);
    expect(narrate.logFields).toMatchObject({ showKind: 'narrate', showScenario: 'retro-3' });
    const reply = await planShow(replyBody(), knowledge, HAIKU_4_5, 1);
    expect(reply.llmRequest.system[1]?.text).toBe(outline);
    expect(reply.logFields).toMatchObject({ showKind: 'reply', showScenario: 'retro-3' });
  });

  it("grounds replies in the scenario's page: `/new` in the profile, `/` in the CV", async () => {
    const byPage = (page: ChatPage) => Promise.resolve(`<knowledge>${page}</knowledge>`);
    const newShow = replyBody({ scenario: RETRO_NEW_SCENARIO_ID });
    const onNew = await planShow(newShow, byPage, HAIKU_4_5, 1);
    expect(onNew.llmRequest.system[1]?.text).toBe(showOutline(SHOW_SCENARIOS['retro-new-1']));
    expect(onNew.llmRequest.system[2]?.text).toBe('<knowledge>profile</knowledge>');
    expect(onNew.logFields).toMatchObject({ showKind: 'reply', showScenario: 'retro-new-1' });
    const onCv = await planShow(replyBody(), byPage, HAIKU_4_5, 1);
    expect(onCv.llmRequest.system[2]?.text).toBe('<knowledge>cv</knowledge>');
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
    expect(streamer.text('fonts: Fonts')).toEqual([]);
    expect(streamer.text(' first.\nfinale: Done.')).toEqual([
      'event: line\ndata: {"key":"fonts","text":"Fonts first."}\n\n',
    ]);
    expect(streamer.end('end_turn')).toEqual([
      'event: line\ndata: {"key":"finale","text":"Done."}\n\n',
    ]);
    expect(streamer.logFields()).toEqual({ narrationLines: 2 });
  });
});
