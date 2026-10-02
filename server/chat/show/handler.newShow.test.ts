import { describe, expect, it } from 'vitest';
import { RETRO_NARRATION_KEYS } from '../../../src/data/retro/scenario.js';
import { RETRO_NEW_SCENARIO_ID, RETRO_NEW_STEPS } from '../../../src/data/retro/scenarioNew.js';
import { chatRequest, NARRATE_BODY, readSse, replyBody, testDeps } from '../../test/helpers.js';
import { handleChat } from '../handler.js';
import { FakeLlmClient } from '../llm/FakeLlmClient.js';
import { showFakeScript } from './showFakeScript.js';

const NEW_NARRATE = { ...NARRATE_BODY, scenario: RETRO_NEW_SCENARIO_ID };

/** Runs one request through the handler with the show's `CHAT_FAKE_LLM=1` script, without delays. */
async function withFakeModel(body: unknown) {
  const llm = new FakeLlmClient((request) => {
    const script = showFakeScript(request);
    if (!script) throw new Error('not a show request');
    return { ...script, delayMs: 0 };
  });
  const deps = testDeps(undefined, { llm });
  const response = await handleChat(chatRequest(body), deps);
  return { logs: deps.logs, requests: llm.requests, response, ...(await readSse(response)) };
}

describe('handleChat v3 on `/new` (retro-new-1), fake model', () => {
  it('streams eight lines and the finale for narrate', async () => {
    const { response, events, logs } = await withFakeModel(NEW_NARRATE);
    expect(response.status).toBe(200);
    const lines = events.filter((event) => event.event === 'line');
    expect(lines.map(({ data }) => (data as { key: string }).key)).toEqual([
      ...RETRO_NARRATION_KEYS,
    ]);
    expect(events.at(-1)?.event).toBe('done');
    expect(logs[0]).toMatchObject({ showScenario: 'retro-new-1', narrationLines: 9 });
  });

  it("answers a reply with `/new`'s outline and the profile's knowledge", async () => {
    const { events, logs, requests } = await withFakeModel(
      replyBody({ scenario: RETRO_NEW_SCENARIO_ID }),
    );
    expect(events.at(-1)?.event).toBe('done');
    const system = requests[0]?.system.map((block) => block.text) ?? [];
    for (const { id, intent } of RETRO_NEW_STEPS) expect(system[1]).toContain(`${id}: ${intent}`);
    expect(system[2]).toContain('<document id="profile" title="Profile">');
    expect(system[2]).not.toContain('<document id="cv"');
    expect(logs[0]).toMatchObject({ showKind: 'reply', showScenario: 'retro-new-1' });
  });
});
