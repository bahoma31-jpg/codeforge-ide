import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCspString, SECURITY_HEADERS } from '@/lib/security/csp';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CSP + Security headers — مصدر واحد مشترك مع next.config.mjs
  response.headers.set('Content-Security-Policy', buildCspString());

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  // Previously excluded /api — now all routes receive security headers.
  // Only static Next.js internals and favicon are excluded.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
