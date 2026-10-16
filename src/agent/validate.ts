import type { AgentToolSpec } from '../data/chat';

/**
 * Checks a tool call's input against the spec's strict JSON Schema: a plain object with exactly
 * the required properties, each a string from its enum. Nothing else is accepted.
 */
export function isValidToolInput(
  spec: AgentToolSpec,
  input: unknown,
): input is Record<string, string> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
  const { properties, required } = spec.inputSchema;
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== required.length || !required.every((key) => key in record)) return false;
  return keys.every((key) => {
    const value = record[key];
    return typeof value === 'string' && (properties[key]?.enum.includes(value) ?? false);
  });
}
