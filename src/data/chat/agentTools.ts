/**
 * The page-agent tool catalogue (docs/chat/AGENT.md §2), shared by the server (Anthropic `tools`)
 * and the browser registry (argument validation, WebMCP later). Framework-free like `contract.ts`;
 * `.js` specifiers because `server/**` runs this file on Node.
 */
import type { CvPage } from '../cvPage.js';
import {
  CV_CONTACT_CHANNELS,
  CV_SECTION_IDS,
  type AgentTargetId,
  type AgentTargetKind,
  type AgentToolCall,
  type AgentToolName,
  type AgentToolResult,
} from './contract.js';

export type { AgentToolCall, AgentToolResult } from './contract.js';

/** One string parameter restricted to an enum of real ids. */
export interface AgentToolEnumParam {
  type: 'string';
  description: string;
  enum: string[];
}

/** Strict-compatible JSON Schema: an object, every property required, nothing extra. */
export type AgentToolInputSchema = {
  type: 'object';
  properties: Record<string, AgentToolEnumParam>;
  required: string[];
  additionalProperties: false;
};

/** A tool as the model sees it; WebMCP's shape minus `execute`. */
export interface AgentToolSpec {
  name: AgentToolName;
  /** For the model; English, one or two sentences. */
  description: string;
  inputSchema: AgentToolInputSchema;
  /** Outward or irreversible: the chat asks the visitor before running it. */
  confirm: boolean;
}

/** What the chat needs from the page: implemented by the browser registry, faked in tests. */
export interface AgentToolExecutor {
  /** The full catalogue, mounted or not. */
  specs(): AgentToolSpec[];
  /** Tools registered right now, sorted (`AgentPageStateV4.tools`). */
  available(): AgentToolName[];
  /** Never throws: invalid input → `invalid_params`, unmounted tool → `not_available`. */
  execute(call: AgentToolCall): Promise<AgentToolResult>;
}

/** The `data-agent-id` value of a target, e.g. `skill:android`. */
export function agentTargetId(kind: AgentTargetKind, id: string): AgentTargetId {
  return `${kind}:${id}`;
}

const items = (kind: AgentTargetKind, list: readonly { id: string }[]) =>
  list.map((item) => agentTargetId(kind, item.id));

/**
 * Every highlightable target of the one page (v4), `<kind>:<id>`: sections, then impact cards,
 * jobs, Transcenda's projects (`app:`), skill groups, books, contacts (header buttons), in data
 * order.
 */
export function cvPageTargetIds(page: CvPage): AgentTargetId[] {
  return [
    ...CV_SECTION_IDS.map((id) => agentTargetId('section', id)),
    ...items('impact', page.impact),
    ...items('experience', page.jobs),
    ...items(
      'app',
      page.jobs.flatMap((job) => job.projects ?? []),
    ),
    ...items('skill', page.skills),
    ...items('book', page.about.books),
    ...CV_CONTACT_CHANNELS.map((id) => agentTargetId('contact', id)),
  ];
}

function oneEnumParam(name: string, description: string, values: readonly string[]) {
  return {
    type: 'object',
    properties: { [name]: { type: 'string', description, enum: [...values] } },
    required: [name],
    additionalProperties: false,
  } satisfies AgentToolInputSchema;
}

/** The one page's catalogue (v4): deterministic (sorted by name, ids in data order). */
export function buildCvPageToolSpecs(page: CvPage): AgentToolSpec[] {
  const specs: AgentToolSpec[] = [
    {
      name: 'highlightElement',
      description:
        'Scroll to a section or item of the page and briefly highlight it, e.g. an impact card, a job, an app, a skill group, a book or a contact.',
      inputSchema: oneEnumParam('target', 'The element to highlight.', cvPageTargetIds(page)),
      confirm: false,
    },
    {
      name: 'openContact',
      description:
        'Open a contact channel of Andrew (email, WhatsApp or LinkedIn). The visitor confirms first.',
      inputSchema: oneEnumParam('channel', 'The contact channel.', CV_CONTACT_CHANNELS),
      confirm: true,
    },
    {
      name: 'scrollToSection',
      description: 'Scroll the page to a section.',
      inputSchema: oneEnumParam(
        'section',
        'The section to scroll to. craft = "Code craft × agentic process", loop = "How I build with agents", impact = "Selected impact", contacts = the closing call to action with every contact.',
        CV_SECTION_IDS,
      ),
      confirm: false,
    },
  ];
  return sortByName(specs);
}

function sortByName(specs: AgentToolSpec[]): AgentToolSpec[] {
  return specs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
