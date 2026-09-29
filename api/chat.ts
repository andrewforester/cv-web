import { readChatConfig } from '../server/chat/config.js';
import { handleChat } from '../server/chat/handler.js';

const config = readChatConfig(process.env);

/** Vercel Function `POST /api/chat` (Node runtime, Web fetch handler). */
export default {
  fetch(request: Request): Promise<Response> {
    return handleChat(request, { config });
  },
};
