import type { Cv } from '../../data';

export type CvUiState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; cv: Cv };
