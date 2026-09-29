import type { ChatConfig } from './config.js';
import { chatError, errorResponse } from './errors.js';
import { CvKnowledgeSource } from './knowledge/CvKnowledgeSource.js';

export interface ChatDeps {
  config: ChatConfig;
}

// Deploy spike: proves Vercel resolves imports from server/ and src/ (incl. the CV JSON).
const source = new CvKnowledgeSource();

export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  const requestId = crypto.randomUUID();
  if (request.method !== 'POST') {
    return errorResponse(chatError('method_not_allowed', 'Use POST'), requestId);
  }
  const [cv] = await source.load('en');
  if (!deps.config.enabled || !deps.config.apiKey || !cv) {
    return errorResponse(chatError('unavailable', 'Chat is not configured'), requestId);
  }
  return errorResponse(chatError('internal_error', 'Not implemented yet'), requestId);
}
