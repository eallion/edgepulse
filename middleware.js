/**
 * EdgeOne Makers Edge Middleware
 * Handles request routing, CORS headers for API endpoints, and host header injection.
 */
export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Handle CORS preflight options for API routes
  if (url.pathname.startsWith('/api/')) {
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
  }

  // Continue request processing chain
  return context.next();
}
