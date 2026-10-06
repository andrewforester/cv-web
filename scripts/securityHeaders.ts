// The security headers of the site. `vercel.json` → `headers` is a static copy of this list
// (Vercel reads JSON only); `e2e/securityHeaders.spec.ts` fails when the two drift apart.
// `vite.config.ts` serves the same list from `vite preview`, so the web check runs under the
// policy production enforces.

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  // The Show case injects raw CSS layers, so inline styles stay allowed.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': contentSecurityPolicy,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'X-Frame-Options': 'DENY',
};
