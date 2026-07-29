/**
 * EdgeOne Edge Function: /api/config
 * Configuration Management API for Sites, Multi-Domain Status Pages, and Webhook Alert channels.
 * Secured via X-API-Key or Bearer Auth Header.
 */

export async function onRequest(context) {
  const { request } = context;
  const kv = typeof MONITOR_KV !== 'undefined' ? MONITOR_KV : null;

  // Simple auth check via environment variable or default key
  const authHeader = request.headers.get('Authorization') || request.headers.get('X-API-Key');
  const apiKey = context.env?.ADMIN_API_KEY || 'edgepulse-secret-key';

  if (request.method !== 'GET' && authHeader !== `Bearer ${apiKey}` && authHeader !== apiKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (request.method === 'GET') {
      // Read configuration from KV
      let config = kv ? await kv.get('config', 'json') : null;
      if (!config) {
        config = {
          title: 'EdgePulse System Status',
          sites: [],
          alerts: {},
        };
      }
      return new Response(JSON.stringify(config), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      // Update configuration in KV
      const body = await request.json();
      if (kv) {
        await kv.put('config', JSON.stringify(body));
        
        // Handle multi-domain mappings if provided
        if (body.domains && Array.isArray(body.domains)) {
          for (const item of body.domains) {
            // item: { host: 'status.a.com', pageId: 'page_a' }
            await kv.put(`domain:${item.host}`, JSON.stringify({ pageId: item.pageId }));
          }
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'Configuration saved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
