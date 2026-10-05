import {
  AGENT_TOOL_NAMES,
  type AgentPageState,
  type AgentToolCall,
  type AgentToolExecutor,
  type AgentToolName,
  type AgentToolResult,
  type AgentToolSpec,
  type CvSectionId,
} from '../data/chat';
import { isValidToolInput } from './validate';

/** A screen's implementation of one tool; input is already validated against the spec. */
export type AgentToolHandler = (
  input: Record<string, string>,
) => AgentToolResult | Promise<AgentToolResult>;

/** Asks the visitor before a `confirm: true` tool runs; supplied by the chat. */
export type AgentConfirm = (request: {
  spec: AgentToolSpec;
  input: Record<string, string>;
}) => Promise<boolean>;

/**
 * What the visitor sees on the page right now: part of the snapshot sent with a question. The
 * old pages' sections stay allowed until the Cleanup task deletes those screens (ADR-0006).
 */
export interface AgentPageView {
  activeSection: CvSectionId | AgentPageState['activeSection'];
  highlighted: AgentPageState['highlighted'];
}

/** Reads the mounted screen's view on demand (when a question is sent). */
export type AgentViewSource = () => AgentPageView;

const NO_VIEW: AgentPageView = { activeSection: null, highlighted: null };

/**
 * Tools the page currently offers, and what it shows (`view`). Screens register handlers while mounted; the chat calls
 * `execute`. Validation, availability and confirmation live here, not in the handlers.
 */
export class AgentToolRegistry implements AgentToolExecutor {
  private catalogue = new Map<AgentToolName, AgentToolSpec>();
  private handlers = new Map<AgentToolName, AgentToolHandler>();
  private confirm: AgentConfirm | null = null;
  private viewSource: AgentViewSource | null = null;

  constructor(specs: AgentToolSpec[] = []) {
    this.setCatalogue(specs);
  }

  setCatalogue(specs: AgentToolSpec[]): void {
    this.catalogue = new Map(specs.map((spec) => [spec.name, spec]));
  }

  /** Registers a handler; the returned function unregisters it (a newer registration stays). */
  register(name: AgentToolName, handler: AgentToolHandler): () => void {
    this.handlers.set(name, handler);
    return () => {
      if (this.handlers.get(name) === handler) this.handlers.delete(name);
    };
  }

  /** Sets the confirmation callback; the returned function clears it. */
  setConfirm(confirm: AgentConfirm): () => void {
    this.confirm = confirm;
    return () => {
      if (this.confirm === confirm) this.confirm = null;
    };
  }

  /** Sets the screen's view source; the returned function clears it (a newer source stays). */
  setViewSource(source: AgentViewSource): () => void {
    this.viewSource = source;
    return () => {
      if (this.viewSource === source) this.viewSource = null;
    };
  }

  /** The section in view and the highlighted target; nothing while no screen is mounted. */
  view(): AgentPageView {
    return this.viewSource?.() ?? NO_VIEW;
  }

  specs(): AgentToolSpec[] {
    return [...this.catalogue.values()];
  }

  available(): AgentToolName[] {
    return [...this.handlers.keys()].sort();
  }

  async execute(call: AgentToolCall): Promise<AgentToolResult> {
    if (!AGENT_TOOL_NAMES.includes(call.name)) return { ok: false, error: 'invalid_params' };
    const spec = this.catalogue.get(call.name);
    const handler = this.handlers.get(call.name);
    if (!spec || !handler) return { ok: false, error: 'not_available' };
    if (!isValidToolInput(spec, call.input)) return { ok: false, error: 'invalid_params' };

    try {
      if (spec.confirm && !(await this.confirm?.({ spec, input: call.input }))) {
        return { ok: false, error: 'declined' };
      }
      return await handler(call.input);
    } catch {
      return { ok: false, error: 'failed' };
    }
  }
}
