/**
 * EdgeOne Edge Function: /admin/
 * Performs Internal Rewrite to serve /admin.html content directly without 302 redirect or Host mismatch.
 */

export async function onRequest(context) {
  return handleAdminRewrite(context);
}

export async function onRequestGet(context) {
  return handleAdminRewrite(context);
}

async function handleAdminRewrite(context) {
  const request = context.request || {};
  const url = new URL(request.url || 'http://localhost/admin/');
  const adminHtmlUrl = new URL('/admin.html', url.origin);

  try {
    const response = await fetch(adminHtmlUrl.toString(), {
      headers: request.headers,
    });

    if (response.ok) {
      const htmlText = await response.text();
      return new Response(htmlText, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (e) {}

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin.html',
    },
  });
}
