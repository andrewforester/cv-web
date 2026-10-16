import { createVoiceDeps } from '../server/voice/deps.js';
import { handleVoiceSession } from '../server/voice/handler.js';

// Built once per instance: the limiter, the minted-token list and the agent sync live across requests.
const deps = createVoiceDeps(process.env);

/** Vercel Function `POST /api/voice-session` (Node runtime, Web fetch handler). Logic: server/voice/. */
export default {
  fetch(request: Request): Promise<Response> {
    return handleVoiceSession(request, deps);
  },
};
