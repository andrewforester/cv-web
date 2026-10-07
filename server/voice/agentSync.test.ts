import { describe, expect, it } from 'vitest';
import type { VoiceSyncLogEntry } from './log.js';
import { buildVoiceAgentConfig } from './agentConfig.js';
import { createAgentSync, sameTool, syncAgent } from './agentSync.js';
import { ElevenLabsError, type ClientToolConfig, type StoredTool } from './ElevenLabsApi.js';
import { FakeElevenLabsApi } from './FakeElevenLabsApi.js';
import { CV_PAGE } from '../chat/cvPageData.js';
import { VOICE_PROMPT_VERSION } from './prompt/voicePrompt.js';

const wanted = buildVoiceAgentConfig('<knowledge>\nCV\n</knowledge>', CV_PAGE);

function wantedTool(index: number): ClientToolConfig {
  const tool = wanted.tools[index];
  if (!tool) throw new Error(`no tool ${index}`);
  return tool;
}

/** As ElevenLabs stores a tool: our config plus its own defaults on the tool and each parameter. */
function stored(id: string, index: number): StoredTool {
  const tool = wantedTool(index);
  const properties = Object.fromEntries(
    Object.entries(tool.parameters.properties).map(([name, param]) => [
      name,
      { ...param, dynamic_variable: '', constant_value: '', is_system_provided: false },
    ]),
  );
  return {
    id,
    config: {
      ...tool,
      parameters: { ...tool.parameters, properties },
      assignments: [],
      dynamic_variables: { dynamic_variable_placeholders: {} },
    },
  };
}

function syncedApi(): FakeElevenLabsApi {
  return new FakeElevenLabsApi({
    agent: {
      prompt: wanted.prompt,
      firstMessage: wanted.firstMessage,
      maxDurationSeconds: 180,
      toolIds: ['system_end_call', 't0', 't1', 't2'],
    },
    tools: [
      stored('t0', 0),
      stored('t1', 1),
      stored('t2', 2),
      { id: 'system_end_call', config: { type: 'system', name: 'end_call' } },
    ],
  });
}

describe('syncAgent', () => {
  it('changes nothing when the agent already matches (stored defaults ignored)', async () => {
    const api = syncedApi();
    expect(await syncAgent(api, 'agent_x', wanted)).toEqual([]);
    expect(api.calls.sort()).toEqual(['getAgent', 'listTools']);
  });

  it('treats fields ElevenLabs leaves out as its defaults (no re-patch on every cold start)', async () => {
    const api = syncedApi();
    for (const tool of api.state.tools) {
      delete tool.config.execution_mode;
      delete tool.config.pre_tool_speech;
      delete tool.config.interruption_mode;
    }
    expect(await syncAgent(api, 'agent_x', wanted)).toEqual([]);
  });

  it('patches only the agent fields that differ', async () => {
    const api = syncedApi();
    api.state.agent.prompt = 'CV voice assistant';
    api.state.agent.maxDurationSeconds = 600;
    expect(await syncAgent(api, 'agent_x', wanted)).toEqual(['prompt', 'maxDurationSeconds']);
    expect(api.state.agent).toMatchObject({ prompt: wanted.prompt, maxDurationSeconds: 180 });
  });

  it('patches a tool whose config changed (e.g. a new CV target)', async () => {
    const api = syncedApi();
    const old = stored('t1', 1);
    old.config.description = 'old';
    api.state.tools[1] = old;
    expect(await syncAgent(api, 'agent_x', wanted)).toEqual([`tool:${wantedTool(1).name}`]);
    expect(api.state.tools[1]?.config).toSatisfy((config: StoredTool['config']) =>
      sameTool(config, wantedTool(1)),
    );
  });

  it("creates missing tools and attaches them, keeping the agent's other tools", async () => {
    const api = new FakeElevenLabsApi({
      agent: {
        prompt: '',
        firstMessage: '',
        maxDurationSeconds: 600,
        toolIds: ['system_end_call'],
      },
      tools: [{ id: 'system_end_call', config: { type: 'system', name: 'end_call' } }],
    });
    const changed = await syncAgent(api, 'agent_x', wanted);
    expect(changed).toEqual([
      ...wanted.tools.map((tool) => `tool:${tool.name}:created`),
      'prompt',
      'firstMessage',
      'maxDurationSeconds',
      'toolIds',
    ]);
    expect(api.state.agent.toolIds).toEqual([
      'system_end_call',
      'tool_fake_1',
      'tool_fake_2',
      'tool_fake_3',
    ]);
    expect(await syncAgent(api, 'agent_x', wanted)).toEqual([]);
  });

  it('replaces a stale attached copy of our tool with the one it reuses', async () => {
    const api = syncedApi();
    api.state.agent.toolIds = ['system_end_call', 't0', 't1'];
    expect(await syncAgent(api, 'agent_x', wanted)).toEqual(['toolIds']);
    expect(api.state.agent.toolIds).toEqual(['system_end_call', 't0', 't1', 't2']);
  });
});

describe('createAgentSync', () => {
  const setup = (api: FakeElevenLabsApi) => {
    const logs: VoiceSyncLogEntry[] = [];
    const sync = createAgentSync(
      api,
      'agent_x',
      async () => wanted,
      (entry) => logs.push(entry as VoiceSyncLogEntry),
    );
    return { sync, logs };
  };

  it('runs once per instance', async () => {
    const api = syncedApi();
    const { sync, logs } = setup(api);
    expect(await Promise.all([sync(), sync()])).toEqual(['unchanged', 'unchanged']);
    expect(await sync()).toBe('unchanged');
    expect(api.calls.filter((call) => call === 'getAgent')).toHaveLength(1);
    expect(logs).toEqual([
      {
        evt: 'voice_sync',
        outcome: 'unchanged',
        promptVersion: VOICE_PROMPT_VERSION,
        changed: [],
        error: null,
      },
    ]);
  });

  it('logs what it patched', async () => {
    const api = syncedApi();
    api.state.agent.firstMessage = '';
    const { sync, logs } = setup(api);
    expect(await sync()).toBe('patched');
    expect(logs[0]).toMatchObject({ outcome: 'patched', changed: ['firstMessage'] });
  });

  it('resolves failed (never rejects) and retries on the next request', async () => {
    const api = syncedApi();
    api.state.failures.getAgent = new ElevenLabsError('get_agent', 'http', 500);
    const { sync, logs } = setup(api);
    expect(await sync()).toBe('failed');
    expect(logs[0]).toMatchObject({
      outcome: 'failed',
      promptVersion: VOICE_PROMPT_VERSION,
      error: 'ElevenLabsError: get_agent 500',
    });
    delete api.state.failures.getAgent;
    expect(await sync()).toBe('unchanged');
  });
});
