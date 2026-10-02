import type { Profile } from '../../data';

export type ProfileUiState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; profile: Profile };
