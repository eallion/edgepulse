/**
 * EdgeOne Makers Platform Middleware
 * File: middleware.js (project root)
 */

export const config = {
  matcher: ['/api/:path*'],
};

export function middleware(context) {
  const { request, next } = context;

  // Handle CORS preflight options for API routes
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Continue to origin/functions
  return next();
}
