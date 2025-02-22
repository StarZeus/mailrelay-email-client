import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRequestLogger } from './lib/logger';

export async function middleware(request: NextRequest) {
  const logger = createRequestLogger(request);
  
  logger.info({
    msg: 'Incoming request',
    headers: Object.fromEntries(request.headers),
  });

  const response = NextResponse.next();
  
  // Add request ID to response headers
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 