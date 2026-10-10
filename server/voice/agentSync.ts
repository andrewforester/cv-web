import type { VoiceAgentConfig } from './agentConfig.js';
import type { AgentPatch, ClientToolConfig, ElevenLabsApi, StoredTool } from './ElevenLabsApi.js';
import type { VoiceLogger } from './log.js';

export type AgentSyncOutcome = 'unchanged' | 'patched' | 'failed';

/** Resolves (never rejects) once the agent matches this deployment, or with `failed`. */
export type AgentSync = () => Promise<AgentSyncOutcome>;

/** More pages of workspace tools than this and the sync gives up (it retries next request). */
const MAX_TOOL_PAGES = 5;

async function listAllTools(api: ElevenLabsApi): Promise<StoredTool[]> {
  const tools: StoredTool[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_TOOL_PAGES; page += 1) {
    const result = await api.listTools(cursor);
    tools.push(...result.items);
    cursor = result.nextCursor;
    if (cursor === undefined) return tools;
  }
  throw new Error(`more than ${MAX_TOOL_PAGES} pages of tools`);
}

/** ElevenLabs' defaults for tool fields it may leave out of a stored config (= ours). */
const ELEVENLABS_TOOL_DEFAULTS: Record<string, unknown> = {
  execution_mode: 'immediate',
  pre_tool_speech: 'auto',
  interruption_mode: 'allow',
};

/** Order-free JSON: objects with sorted keys, so stored and built configs compare by content. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
  );
}

/**
 * The stored tool already says what we want: compares only the fields we set. ElevenLabs adds
 * its own defaults to the stored config and to each parameter; those are ignored.
 */
export function sameTool(stored: StoredTool['config'], wanted: ClientToolConfig): boolean {
  const storedParams = (stored.parameters ?? {}) as Partial<ClientToolConfig['parameters']>;
  const projected = {
    ...Object.fromEntries(
      Object.keys(wanted).map((key) => [key, stored[key] ?? ELEVENLABS_TOOL_DEFAULTS[key]]),
    ),
    parameters: {
      type: storedParams.type,
      required: [...(storedParams.required ?? [])].sort(),
      properties: Object.fromEntries(
        Object.entries(storedParams.properties ?? {}).map(([name, param]) => [
          name,
          { type: param.type, description: param.description, enum: param.enum },
        ]),
      ),
    },
  };
  const target = {
    ...wanted,
    parameters: { ...wanted.parameters, required: [...wanted.parameters.required].sort() },
  };
  return JSON.stringify(canonical(projected)) === JSON.stringify(canonical(target));
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join('\n') === [...b].sort().join('\n');

/**
 * Brings the agent to `wanted`: creates missing tools, patches changed ones, then patches the
 * agent's prompt, first message, max duration and tool list where they differ, and its security
 * (§10): auth on, every client override off. Tools of the agent that are not ours (by name) stay
 * attached. Returns what changed.
 */
export async function syncAgent(
  api: ElevenLabsApi,
  agentId: string,
  wanted: VoiceAgentConfig,
): Promise<string[]> {
  const [agent, allTools] = await Promise.all([api.getAgent(agentId), listAllTools(api)]);
  const tools = allTools.filter((stored) => stored.config.type === 'client');
  const changed: string[] = [];
  const ourNames = new Set(wanted.tools.map((tool) => tool.name));
  const ourIds: string[] = [];
  for (const tool of wanted.tools) {
    const candidates = tools.filter((stored) => stored.config.name === tool.name);
    const existing =
      candidates.find((stored) => agent.toolIds.includes(stored.id)) ?? candidates[0];
    if (!existing) {
      ourIds.push((await api.createTool(tool)).id);
      changed.push(`tool:${tool.name}:created`);
      continue;
    }
    if (!sameTool(existing.config, tool)) {
      await api.patchTool(existing.id, tool);
      changed.push(`tool:${tool.name}`);
    }
    ourIds.push(existing.id);
  }

  const nameById = new Map(tools.map((stored) => [stored.id, stored.config.name]));
  const foreignIds = agent.toolIds.filter((id) => !ourNames.has(nameById.get(id) ?? ''));
  const toolIds = [...foreignIds, ...ourIds];
  const patch: AgentPatch = {};
  if (agent.prompt !== wanted.prompt) patch.prompt = wanted.prompt;
  if (agent.firstMessage !== wanted.firstMessage) patch.firstMessage = wanted.firstMessage;
  if (agent.maxDurationSeconds !== wanted.maxDurationSeconds) {
    patch.maxDurationSeconds = wanted.maxDurationSeconds;
  }
  if (!sameSet(agent.toolIds, toolIds)) patch.toolIds = toolIds;
  if (!agent.authEnabled) patch.authEnabled = true;
  if (agent.overridesOn.length > 0) patch.overridesOff = agent.overridesOn;
  if (Object.keys(patch).length > 0) {
    await api.patchAgent(agentId, patch);
    const { overridesOff = [], ...fields } = patch;
    changed.push(...Object.keys(fields), ...overridesOff.map((path) => `override:${path}`));
  }
  return changed;
}

/**
 * The once-per-instance sync (docs/voice/SYSTEM_DESIGN.md §6): a memoized promise, cleared on
 * failure so the next request retries. Logs one `voice_sync` line per attempt. A failure never
 * blocks the token: the call runs on the agent's previous config.
 */
export function createAgentSync(
  api: ElevenLabsApi,
  agentId: string,
  wanted: () => Promise<VoiceAgentConfig>,
  log: VoiceLogger,
): AgentSync {
  let running: Promise<AgentSyncOutcome> | undefined;
  return () => {
    running ??= (async (): Promise<AgentSyncOutcome> => {
      let promptVersion: string | null = null;
      try {
        const config = await wanted();
        promptVersion = config.promptVersion;
        const changed = await syncAgent(api, agentId, config);
        const outcome = changed.length > 0 ? 'patched' : 'unchanged';
        log({ evt: 'voice_sync', outcome, promptVersion, changed, error: null });
        return outcome;
      } catch (error) {
        running = undefined;
        log({
          evt: 'voice_sync',
          outcome: 'failed',
          promptVersion,
          changed: [],
          error: String(error),
        });
        return 'failed';
      }
    })();
    return running;
  };
}
