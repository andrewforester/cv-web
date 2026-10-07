import type { ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { loadEnv, type Connect, type Plugin, type ViteDevServer } from 'vite';
import { CHAT_API_PATH } from '../../src/data/chat/contract.js';
import { VOICE_API_PATH } from '../../src/data/voice/contract.js';

/** Server-side env the functions read; loaded from `.env*.local`, never exposed to the page. */
const SERVER_ENV_KEYS = [
  'ANTHROPIC_API_KEY',
  'CHAT_MODEL',
  'CHAT_ENABLED',
  'CHAT_FAKE_LLM',
  'CHAT_DAILY_BUDGET_USD',
  'VOICE_ENABLED',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_AGENT_ID',
  'VOICE_FAKE',
];

/** The functions served in dev: request path → entry file in `api/`. */
const ENTRIES = new Map([
  [CHAT_API_PATH, '/api/chat.ts'],
  [VOICE_API_PATH, '/api/voice-session.ts'],
]);

interface FunctionModule {
  default: { fetch(request: Request): Promise<Response> };
}

function toWebRequest(req: Connect.IncomingMessage, signal: AbortSignal): Request {
  const url = new URL(
    req.originalUrl ?? req.url ?? '/',
    `http://${req.headers.host ?? 'localhost'}`,
  );
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream<Uint8Array>) : undefined,
    signal,
    duplex: 'half',
  } as RequestInit);
}

async function sendWebResponse(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.flushHeaders();
  if (!response.body) {
    res.end();
    return;
  }
  const reader = response.body.getReader();
  res.on('close', () => void reader.cancel().catch(() => undefined));
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(value);
  }
  res.end();
}

async function handle(
  server: ViteDevServer,
  entry: string,
  req: Connect.IncomingMessage,
  res: ServerResponse,
) {
  const disconnect = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) disconnect.abort();
  });
  // Loaded through Vite's SSR loader on every request: edits to server/** apply without a restart.
  const fn = (await server.ssrLoadModule(entry)) as FunctionModule;
  const response = await fn.default.fetch(toWebRequest(req, disconnect.signal));
  await sendWebResponse(response, res);
}

/**
 * Mounts `/api/chat` and `/api/voice-session` on `npm run dev` by calling the same `fetch` exports
 * Vercel calls (docs/chat/SYSTEM_DESIGN.md §12). With `CHAT_FAKE_LLM=1` the chat answers without a
 * key; with `VOICE_FAKE=1` the voice session returns a fake token without ElevenLabs.
 */
export function chatApiPlugin(): Plugin {
  return {
    name: 'cv-chat-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '');
      for (const key of SERVER_ENV_KEYS) {
        if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
      }
      server.middlewares.use((req, res, next) => {
        const path = (req.originalUrl ?? req.url ?? '').split('?')[0];
        const entry = path === undefined ? undefined : ENTRIES.get(path);
        if (!entry) return next();
        handle(server, entry, req, res).catch((error: unknown) => {
          server.config.logger.error(`[api] ${path} ${String(error)}`);
          if (!res.headersSent) res.statusCode = 500;
          res.end();
        });
      });
    },
  };
}
