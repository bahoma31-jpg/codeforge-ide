/**
 * @module middleware
 * @description Next.js security middleware for CodeForge IDE.
 * Applies comprehensive security headers to all responses to protect
 * against common web vulnerabilities including XSS, clickjacking,
 * and MIME type sniffing.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security middleware that adds protective HTTP headers to all responses.
 *
 * Headers applied:
 * - Content-Security-Policy: Restricts resource loading (allows Monaco Editor)
 * - Strict-Transport-Security: Enforces HTTPS connections
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 * - X-XSS-Protection: XSS filter for legacy browsers
 *
 * @param request - The incoming Next.js request
 * @returns Modified response with security headers
 */
export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Content Security Policy - allows Monaco Editor (unsafe-eval) and blob workers
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://registry.npmjs.org",
      "worker-src 'self' blob:",
      "frame-src 'none'",
    ].join('; ')
  );

  // HTTP Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - disable unnecessary browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // XSS Protection for legacy browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

/** Middleware configuration - exclude static assets and API routes */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
