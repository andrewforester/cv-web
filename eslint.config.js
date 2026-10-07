import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

// Architecture boundaries (AGENTS.md → Architecture & code quality). Each message tells the agent
// what to do instead: a boundary error means the design is off, not that the rule needs a disable.
const noServer = {
  regex: '(^|/)(server|api)/',
  message:
    'The browser app must not import backend code. Share types via src/data/chat/contract.ts.',
};
const noAnthropicSdk = {
  group: ['@anthropic-ai/*'],
  message: 'The model is called only by server/chat/llm. The browser talks to POST /api/chat.',
};
// ADR-0008: one adapter file owns the voice SDK; everything else sees the VoiceClient interface.
const ELEVENLABS_ADAPTER = 'src/data/voice/ElevenLabsVoiceClient.ts';
const noElevenLabsSdk = {
  group: ['@elevenlabs/*'],
  message: `@elevenlabs/* is imported only by ${ELEVENLABS_ADAPTER}. Use the VoiceClient interface from src/data/voice (bound in AppProviders).`,
};
const noElevenLabsServer = {
  group: ['@elevenlabs/*'],
  message:
    'The server talks to ElevenLabs with plain fetch (server/voice), never through the browser SDK.',
};
const noElevenLabsDynamic = [
  {
    selector: 'ImportExpression[source.value=/^@elevenlabs\\//]',
    message: `@elevenlabs/* is loaded only by ${ELEVENLABS_ADAPTER}. Use the VoiceClient interface from src/data/voice.`,
  },
];
const noMocks = {
  regex: '(^|/)data/mock/',
  message:
    'UI never reads mocks: get data from a repository hook (e.g. useCvRepository()) in the state holder. The mock is bound once in src/app/AppProviders.tsx.',
};
const noMocksBackend = {
  regex: '(^|/)data/mock/',
  message:
    'Mock fixtures are for tests only. The server reads the CV through server/chat/cvPageData.ts.',
};
const noCvJson = [
  {
    selector: 'ImportDeclaration[source.value=/(^|\\/)cv\\/cvPage\\.json$|^\\.\\/cvPage\\.json$/]',
    message:
      'The CV JSON has two readers: the page via CvPageRepository (src/data/cv/StaticCvRepository.ts) and the server via server/chat/cvPageData.ts. Get the data from the repository or from CV_PAGE.',
  },
];
const noScreens = {
  regex: '(^|/)screens/',
  message:
    'Lower layers must not depend on screens. Move the shared piece down (src/shared, src/data) instead.',
};
const noOtherScreen = {
  regex: '^\\.\\./[^./][^/]*/',
  message:
    'A screen must not import another screen. When a second screen needs a piece, move it to src/shared/ in its own PR.',
};
const noFrontendLayers = {
  regex: '(^|/)src/(app|screens|shared|agent|theme)/',
  message:
    'Backend code may use only the data layer (src/data: models, contracts) and src/i18n types.',
};
const noReact = {
  group: ['react', 'react-dom', 'react-dom/*'],
  message: 'Backend code is framework-free: no React on the server.',
};

const restrict = (...patterns) => ({ 'no-restricted-imports': ['error', { patterns }] });
const testFiles = ['**/*.test.{ts,tsx}', '**/*TestHarness.tsx'];

export default tseslint.config(
  { ignores: ['dist', 'playwright-report', 'test-results', 'web-check'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict, prettier],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Small files (AGENTS.md → Small files): split a file that grows past this.
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'api/**/*.ts'],
    ignores: testFiles,
    rules: { 'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }] },
  },
  { files: ['src/**/*.{ts,tsx}'], rules: restrict(noServer, noAnthropicSdk, noElevenLabsSdk) },
  {
    files: ['src/{data,i18n,theme}/**/*.{ts,tsx}'],
    rules: restrict(noServer, noAnthropicSdk, noScreens, noElevenLabsSdk),
  },
  {
    files: ['src/{shared,agent}/**/*.{ts,tsx}'],
    ignores: testFiles,
    rules: restrict(noServer, noAnthropicSdk, noScreens, noMocks, noElevenLabsSdk),
  },
  {
    files: ['src/screens/**/*.{ts,tsx}'],
    ignores: testFiles,
    rules: restrict(noServer, noAnthropicSdk, noMocks, noOtherScreen, noElevenLabsSdk),
  },
  {
    files: ['server/**/*.ts', 'api/**/*.ts'],
    rules: restrict(noFrontendLayers, noReact, noMocksBackend, noElevenLabsServer),
  },
  {
    // ADR-0007: the CV file has exactly two readers (and tests).
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'api/**/*.ts'],
    ignores: [...testFiles, 'src/data/cv/StaticCvRepository.ts', 'server/chat/cvPageData.ts'],
    rules: { 'no-restricted-syntax': ['error', ...noCvJson, ...noElevenLabsDynamic] },
  },
  {
    // The voice SDK's one importer (static types, worklet URLs and the lazy `import()`).
    files: [ELEVENLABS_ADAPTER],
    rules: {
      ...restrict(noServer, noAnthropicSdk, noScreens),
      'no-restricted-syntax': ['error', ...noCvJson],
    },
  },
  {
    files: ['*.config.{ts,js}', 'e2e/**/*.ts', 'api/**/*.ts', 'server/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
);
