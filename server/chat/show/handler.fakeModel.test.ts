import { describe, expect, it } from 'vitest';
import { RETRO_NARRATION_KEYS, RETRO_STEPS } from '../../../src/data/retro/scenario.js';
import { chatRequest, NARRATE_BODY, readSse, replyBody, testDeps } from '../../test/helpers.js';
import { handleChat } from '../handler.js';
import { FakeLlmClient } from '../llm/FakeLlmClient.js';
import { showFakeScript } from './showFakeScript.js';

/** Runs one request through the handler with the show's `CHAT_FAKE_LLM=1` script, without delays. */
async function withFakeModel(body: unknown) {
  const llm = new FakeLlmClient((request) => {
    const script = showFakeScript(request);
    if (!script) throw new Error('not a show request');
    return { ...script, delayMs: 0 };
  });
  const deps = testDeps(undefined, { llm });
  const response = await handleChat(chatRequest(body), deps);
  return { deps, requests: llm.requests, response, ...(await readSse(response)) };
}

describe('handleChat v3 (retro-4), fake model', () => {
  it('streams eight lines and the finale for narrate', async () => {
    const { response, events, deps } = await withFakeModel(NARRATE_BODY);
    expect(response.status).toBe(200);
    const lines = events.filter((event) => event.event === 'line');
    expect(lines.map(({ data }) => (data as { key: string }).key)).toEqual([
      ...RETRO_NARRATION_KEYS,
    ]);
    expect(events.at(-1)?.event).toBe('done');
    expect(deps.logs[0]).toMatchObject({ showScenario: 'retro-4', narrationLines: 9 });
  });

  it("answers a reply with retro-4's outline and the one page's knowledge", async () => {
    const { events, deps, requests } = await withFakeModel(replyBody());
    expect(events.at(-1)?.event).toBe('done');
    const system = requests[0]?.system.map((block) => block.text) ?? [];
    for (const { id, intent } of RETRO_STEPS) expect(system[1]).toContain(`${id}: ${intent}`);
    expect(system[2]).toBe(await deps.cvPageKnowledge());
    expect(system[2]).not.toContain('<document id="profile"');
    expect(deps.logs[0]).toMatchObject({ showKind: 'reply', showScenario: 'retro-4' });
  });
});
