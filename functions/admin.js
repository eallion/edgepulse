/**
 * EdgeOne Edge Function: /admin
 * Intercepts /admin and /admin/ clean URLs and seamlessly redirects to /admin.html
 */

export async function onRequest(context) {
  return handleAdminRoute(context);
}

export async function onRequestGet(context) {
  return handleAdminRoute(context);
}

function handleAdminRoute(context) {
  const request = context.request || {};
  const url = new URL(request.url || 'http://localhost/admin');
  
  // Clean redirect from /admin or /admin/ to /admin.html
  const targetUrl = `${url.protocol}//${url.host}/admin.html`;

  return Response.redirect(targetUrl, 302);
}
