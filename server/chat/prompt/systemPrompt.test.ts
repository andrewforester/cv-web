import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  INSTRUCTIONS,
  KNOWLEDGE_RULES,
  PROMPT_VERSION,
  SAFETY_RULES,
  SCOPE_RULES,
} from './systemPrompt.js';

describe('INSTRUCTIONS', () => {
  it('keeps the bytes of PROMPT_VERSION 2026-10-05.1 after the split into shared blocks', () => {
    // A change here is a prompt change: bump PROMPT_VERSION, then update the hash and length.
    expect(PROMPT_VERSION).toBe('2026-10-05.1');
    expect(INSTRUCTIONS).toHaveLength(2685);
    expect(createHash('sha256').update(INSTRUCTIONS).digest('hex')).toBe(
      'e7128ca894aa0dd64317943189d4204d8014c40a2b99d0667816e1ea8a938045',
    );
  });

  it('contains each shared block whole', () => {
    for (const block of [KNOWLEDGE_RULES, SCOPE_RULES, SAFETY_RULES]) {
      expect(INSTRUCTIONS).toContain(`\n\n${block}\n\n`);
    }
  });
});
