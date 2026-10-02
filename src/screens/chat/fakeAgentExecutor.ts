import {
  type AgentToolCall,
  type AgentToolExecutor,
  type AgentToolName,
  type AgentToolResult,
  type AgentToolSpec,
} from '../../data/chat';

/** Test double of the page registry: a page's real catalogue, recorded calls, scripted results. */
export class FakeAgentExecutor implements AgentToolExecutor {
  readonly executed: AgentToolCall[] = [];
  /** Results by tool name; `ok` for anything not listed. */
  results: Partial<Record<AgentToolName, AgentToolResult>> = {};

  constructor(private readonly specList: AgentToolSpec[]) {}

  specs(): AgentToolSpec[] {
    return this.specList;
  }

  available(): AgentToolName[] {
    return this.specList.map((spec) => spec.name);
  }

  execute(call: AgentToolCall): Promise<AgentToolResult> {
    this.executed.push(call);
    return Promise.resolve(this.results[call.name] ?? { ok: true });
  }
}
