import { describe, expect, it } from 'vitest';
import profileEn from '../../src/data/mock/profile.en.json' with { type: 'json' };
import profileUk from '../../src/data/mock/profile.uk.json' with { type: 'json' };
import type { Profile } from '../../src/data/profile.js';
import { chatRequest, profileBody, question, readSse, testDeps, v2Body } from '../test/helpers.js';
import { handleChat } from './handler.js';
import { renderProfile } from './knowledge/renderProfile.js';
import { LLM_TOOLS, LLM_TOOLS_BY_PAGE } from './prompt/llmTools.js';

async function llmRequestFor(body: unknown) {
  const deps = testDeps();
  const response = await handleChat(chatRequest(body), deps);
  await response.text();
  return { response, request: deps.llm.requests[0], log: deps.logs[0] };
}

const knowledgeOf = (request: Awaited<ReturnType<typeof llmRequestFor>>['request']) =>
  request?.system.find((block) => block.cache_control)?.text ?? '';

describe('handleChat: page-aware v2', () => {
  it('answers a request without page exactly like page cv (the / request)', async () => {
    const legacy = await llmRequestFor(v2Body(question('Hi')));
    const cv = await llmRequestFor({ ...v2Body(question('Hi')), page: 'cv' });
    expect(JSON.stringify(cv.request)).toBe(JSON.stringify(legacy.request));
    expect(knowledgeOf(legacy.request)).toContain('<document id="cv" title="CV">');
    expect(legacy.request?.tools).toEqual([...LLM_TOOLS]);
    expect(legacy.log).toMatchObject({ page: 'cv', status: 200 });
  });

  it.each([
    ['en', profileEn as Profile],
    ['uk', profileUk as Profile],
  ] as const)(
    "answers on /new (%s) from the profile only, with /new's tools",
    async (locale, p) => {
      const { response, request, log } = await llmRequestFor(profileBody(locale));
      expect(response.status).toBe(200);
      const knowledge = knowledgeOf(request);
      expect(knowledge).toContain(`<document id="profile" title="Profile">\n${renderProfile(p)}`);
      expect(knowledge).not.toContain('<document id="cv"');
      expect(knowledge).not.toContain('Product-minded Senior Android Engineer');
      expect(request?.system.at(-1)?.text).toContain(`(${locale})`);
      expect(request?.tools).toEqual([...LLM_TOOLS_BY_PAGE.profile]);
      expect(log).toMatchObject({ page: 'profile', locale, v: 2 });
    },
  );

  it('keeps the CV knowledge for v1, whatever page it names', async () => {
    const body = {
      v: 1,
      locale: 'en',
      page: 'profile',
      messages: [{ role: 'user', content: 'Hi' }],
    };
    const { request, log } = await llmRequestFor(body);
    expect(knowledgeOf(request)).toContain('<document id="cv" title="CV">');
    expect(request?.tools).toBeUndefined();
    expect(log).toMatchObject({ page: 'cv', v: 1 });
  });

  it('rejects an unknown page or a route of the other page with 400 before the model', async () => {
    const deps = testDeps();
    const unknown = await handleChat(chatRequest({ ...profileBody(), page: 'new' }), deps);
    expect(unknown.status).toBe(400);
    expect(unknown.headers.get('X-Chat-Api-Version')).toBe('2');
    const mismatch = { ...profileBody(), page: 'cv' };
    const response = await handleChat(chatRequest(mismatch), deps);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'invalid_request',
        message: 'messages[0].page.route must be "/"',
        retryable: false,
      },
    });
    expect(deps.llm.requests).toHaveLength(0);
    expect(deps.logs.map((entry) => entry.page)).toEqual([null, null]);
  });

  it('streams a tool round on /new like on /', async () => {
    const deps = testDeps({
      deltas: ['Scrolling.'],
      toolCalls: [{ id: 'toolu_1', name: 'scrollToSection', input: { section: 'impact' } }],
    });
    const { events } = await readSse(await handleChat(chatRequest(profileBody()), deps));
    expect(events.map((event) => event.event)).toEqual(['delta', 'tool_call', 'done']);
    expect(events[1]?.data).toMatchObject({
      name: 'scrollToSection',
      input: { section: 'impact' },
    });
  });
});
