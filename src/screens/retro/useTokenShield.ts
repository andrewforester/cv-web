import { useState } from 'react';
import siteTokensCss from '../../theme/tokens.css?raw';
import { readLiveToken } from './engine/layerHost';

/** Every custom property the site declares in `tokens.css`. */
const TOKEN_NAMES = [...siteTokensCss.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(
  ([, name = '']) => name,
);

/**
 * The token shield (SPEC → Agent chat panel, Decision 24): the site's design tokens with their live
 * values, read once when the show starts, past the damage layers. The dock re-declares them, so
 * the token layers that restyle `:root` for most of the show never reach the agent chat.
 */
export function useTokenShield(): Readonly<Record<string, string>> {
  const [tokens] = useState(() => {
    const entries = TOKEN_NAMES.map((name) => [name, readLiveToken(document, name)] as const);
    return Object.fromEntries(entries.filter((entry): entry is [string, string] => !!entry[1]));
  });
  return tokens;
}
