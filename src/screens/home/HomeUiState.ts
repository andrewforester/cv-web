export type HomeUiState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; name: string; title: string };
