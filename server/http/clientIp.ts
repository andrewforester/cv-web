/**
 * The client IP for the in-memory limiter: `x-real-ip`, else the first `x-forwarded-for` entry
 * (Vercel sets both). Never logged or stored beyond the limiter's memory.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}
