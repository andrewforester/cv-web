import type { ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import { loadEnv, type Connect, type Plugin, type ViteDevServer } from 'vite';
import { CHAT_API_PATH } from '../../src/data/chat/contract.js';

/** Server-side env the chat function reads; loaded from `.env*.local`, never exposed to the page. */
const CHAT_ENV_KEYS = ['ANTHROPIC_API_KEY', 'CHAT_MODEL', 'CHAT_ENABLED', 'CHAT_FAKE_LLM'];

interface ChatModule {
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

async function handle(server: ViteDevServer, req: Connect.IncomingMessage, res: ServerResponse) {
  const disconnect = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) disconnect.abort();
  });
  // Loaded through Vite's SSR loader on every request: edits to server/** apply without a restart.
  const chat = (await server.ssrLoadModule('/api/chat.ts')) as ChatModule;
  const response = await chat.default.fetch(toWebRequest(req, disconnect.signal));
  await sendWebResponse(response, res);
}

/**
 * Mounts `/api/chat` on `npm run dev` by calling the same `fetch` export Vercel calls
 * (docs/chat/SYSTEM_DESIGN.md §12). With `CHAT_FAKE_LLM=1` it answers without a key.
 */
export function chatApiPlugin(): Plugin {
  return {
    name: 'cv-chat-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '');
      for (const key of CHAT_ENV_KEYS) {
        if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
      }
      server.middlewares.use((req, res, next) => {
        const path = (req.originalUrl ?? req.url ?? '').split('?')[0];
        if (path !== CHAT_API_PATH) return next();
        handle(server, req, res).catch((error: unknown) => {
          server.config.logger.error(`[chat-api] ${String(error)}`);
          if (!res.headersSent) res.statusCode = 500;
          res.end();
        });
      });
    },
  };
}
