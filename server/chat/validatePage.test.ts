import { describe, expect, it } from 'vitest';
import { PROFILE_SECTION_IDS } from '../../src/data/chat/contract.js';
import { PAGE, profileBody, PROFILE_PAGE, question, v2Body } from '../test/helpers.js';
import { validateChatRequest } from './validate.js';
import { chatPageOf } from './validateParts.js';

function errorOf(body: unknown) {
  const result = validateChatRequest(body);
  return result.ok ? 'ok' : `${result.error.code}: ${result.error.message}`;
}

const withPage = (page: object) => ({
  ...profileBody(),
  messages: [{ role: 'user', content: 'Hi', page: { ...PROFILE_PAGE, ...page } }],
});

describe('validateChatRequest: page-aware v2', () => {
  it('keeps the page when sent, and resolves an absent one to the CV', () => {
    const profile = validateChatRequest(profileBody());
    expect(profile.ok && profile.request).toMatchObject({ page: 'profile', toolRound: 0 });
    expect(profile.ok && chatPageOf(profile.request)).toBe('profile');

    const legacy = validateChatRequest(v2Body());
    expect(legacy.ok && 'page' in legacy.request).toBe(false);
    expect(legacy.ok && chatPageOf(legacy.request)).toBe('cv');

    const cv = validateChatRequest({ ...v2Body(), page: 'cv' });
    expect(cv.ok && chatPageOf(cv.request)).toBe('cv');
  });

  it('rejects an unknown page', () => {
    for (const page of ['new', '/new', '', null, 1]) {
      expect(errorOf({ ...profileBody(), page })).toBe(
        'invalid_request: page must be one of cv, profile',
      );
    }
  });

  it("requires every question's route to be the page's path", () => {
    expect(errorOf(withPage({ route: '/' }))).toBe(
      'invalid_request: messages[0].page.route must be "/new"',
    );
    expect(errorOf({ ...v2Body(question('Hi')), page: 'cv' })).toBe('ok');
    const cvOnNew = { ...v2Body(), messages: [{ ...question('Hi'), page: PROFILE_PAGE }] };
    expect(errorOf(cvOnNew)).toBe('invalid_request: messages[0].page.route must be "/"');
  });

  it("checks activeSection against the page's sections", () => {
    for (const section of PROFILE_SECTION_IDS) {
      expect(errorOf(withPage({ activeSection: section }))).toBe('ok');
    }
    expect(errorOf(withPage({ activeSection: 'technologies' }))).toBe(
      'invalid_request: messages[0].page.activeSection is invalid',
    );
    const cvWithProfileSection = v2Body({
      role: 'user',
      content: 'Hi',
      page: { ...PAGE, activeSection: 'loop' as never },
    });
    expect(errorOf(cvWithProfileSection)).toBe(
      'invalid_request: messages[0].page.activeSection is invalid',
    );
  });

  it('accepts the impact and skill targets in highlighted', () => {
    expect(errorOf(withPage({ highlighted: 'impact:users' }))).toBe('ok');
    expect(errorOf(withPage({ highlighted: 'skill:ai-engineering' }))).toBe('ok');
    expect(errorOf(withPage({ highlighted: 'loop:frame' }))).toBe(
      'invalid_request: messages[0].page.highlighted is invalid',
    );
  });

  it('ignores page on v1, like any unknown field', () => {
    const v1 = {
      v: 1,
      locale: 'en',
      page: 'nonsense',
      messages: [{ role: 'user', content: 'Hi' }],
    };
    const result = validateChatRequest(v1);
    expect(result.ok && result.request).toEqual({
      v: 1,
      locale: 'en',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(result.ok && chatPageOf(result.request)).toBe('cv');
  });
});
