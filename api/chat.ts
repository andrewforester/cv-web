import { createChatDeps } from '../server/chat/deps.js';
import { handleChat } from '../server/chat/handler.js';

// Built once per instance, so the in-memory limiter and the knowledge memo live across requests.
const deps = createChatDeps(process.env);

/** Vercel Function `POST /api/chat` (Node runtime, Web fetch handler). Logic: server/chat/. */
export default {
  fetch(request: Request): Promise<Response> {
    return handleChat(request, deps);
  },
};
