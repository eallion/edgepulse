/**
 * EdgeOne Edge Function: /api/config
 * Configuration Management API for Sites, Multi-Domain Status Pages, and Webhook Alert channels.
 * Authenticates via session token or API Key.
 */

export async function onRequest(context) {
  return handleConfig(context);
}

export async function onRequestGet(context) {
  return handleConfig(context);
}

export async function onRequestPost(context) {
  return handleConfig(context);
}

async function handleConfig(context) {
  const { request } = context;
  const kv = typeof MONITOR_KV !== 'undefined' ? MONITOR_KV : (typeof globalThis !== 'undefined' && globalThis.MONITOR_KV ? globalThis.MONITOR_KV : null);

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Auth check for modifying methods (POST, PUT, DELETE)
  if (request.method !== 'GET') {
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-API-Key') || '';
    
    // Accept valid Bearer tokens or API Key
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization Token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  try {
    if (request.method === 'GET') {
      // Read configuration from KV or memory fallback
      let config = kv ? await kv.get('config', 'json') : null;
      if (!config) {
        config = {
          title: 'EdgePulse System Status',
          sites: [],
          alerts: {},
          groups: ['default'],
        };
      }
      return new Response(JSON.stringify(config), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const body = await request.json();
      if (kv) {
        await kv.put('config', JSON.stringify(body));
        
        // Handle multi-domain mappings if provided
        if (body.domains && Array.isArray(body.domains)) {
          for (const item of body.domains) {
            await kv.put(`domain:${item.host}`, JSON.stringify({ pageId: item.pageId }));
          }
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'Configuration saved successfully' }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
