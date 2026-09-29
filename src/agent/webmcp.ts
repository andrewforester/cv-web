import type { AgentToolExecutor, AgentToolInputSchema, AgentToolResult } from '../data/chat';

/**
 * The WebMCP draft's tool shape (`navigator.modelContext`): a spec plus `execute`. Not wired:
 * a later adapter registers `toWebMcpTools(registry)` behind feature detection (AGENT.md §2).
 */
export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: AgentToolInputSchema;
  execute(input: Record<string, unknown>): Promise<AgentToolResult>;
}

/** The currently mounted tools in WebMCP shape; `execute` goes through the registry's checks. */
export function toWebMcpTools(executor: AgentToolExecutor): WebMcpTool[] {
  const mounted = new Set(executor.available());
  return executor
    .specs()
    .filter((spec) => mounted.has(spec.name))
    .map((spec) => ({
      name: spec.name,
      description: spec.description,
      inputSchema: spec.inputSchema,
      execute: (input) => executor.execute({ id: spec.name, name: spec.name, input }),
    }));
}
