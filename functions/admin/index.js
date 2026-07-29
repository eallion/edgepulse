/**
 * EdgeOne Edge Function: /admin/
 * Intercepts /admin/ clean URL and seamlessly redirects to /admin.html
 */

export async function onRequest(context) {
  const request = context.request || {};
  const url = new URL(request.url || 'http://localhost/admin/');
  const targetUrl = `${url.protocol}//${url.host}/admin.html`;

  return Response.redirect(targetUrl, 302);
}
