import type { Strings } from './strings';

/** The texts of a strings namespace (English, the only locale). */
export function useStrings<T extends Record<string, string>>(namespace: Strings<T>): T {
  return namespace.en;
}
