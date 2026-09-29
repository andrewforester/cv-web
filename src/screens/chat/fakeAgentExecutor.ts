import {
  buildAgentToolSpecs,
  type AgentToolCall,
  type AgentToolExecutor,
  type AgentToolName,
  type AgentToolResult,
  type AgentToolSpec,
} from '../../data/chat';
import type { Cv } from '../../data/models';

/** Test double of the page registry: the real catalogue, recorded calls, scripted results. */
export class FakeAgentExecutor implements AgentToolExecutor {
  readonly executed: AgentToolCall[] = [];
  private readonly specList: AgentToolSpec[];
  /** Results by tool name; `ok` for anything not listed. */
  results: Partial<Record<AgentToolName, AgentToolResult>> = {};

  constructor(cv: Cv) {
    this.specList = buildAgentToolSpecs(cv);
  }

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
