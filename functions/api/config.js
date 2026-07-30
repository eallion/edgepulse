/**
 * EdgeOne Edge Function: /api/config
 * Configuration Management API with globalThis cross-isolate persistence for dev server.
 */

// Initialize globalThis singleton storage for local dev server
if (!globalThis.__EDGEPULSE_CONFIG__) {
  globalThis.__EDGEPULSE_CONFIG__ = {
    title: 'EdgePulse Status',
    favicon: '/public/images/logo.svg',
    icp: '',
    sites: [],
    alerts: {},
    groups: ['default'],
  };
}

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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Auth check for modifying methods (POST, PUT, DELETE)
  if (request.method !== 'GET') {
    const authHeader = request.headers.get('Authorization') || request.headers.get('X-API-Key') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization Token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  try {
    if (request.method === 'GET') {
      let config = kv ? await kv.get('config', 'json') : null;
      if (!config) {
        config = globalThis.__EDGEPULSE_CONFIG__;
      } else {
        globalThis.__EDGEPULSE_CONFIG__ = config;
      }

      return new Response(JSON.stringify(config), {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const body = await request.json();

      // Handle Irreversible Reset Purge Action
      if (body.action === 'reset') {
        const inputPassword = (body.confirmPassword || '').trim();
        let authConfig = kv ? await kv.get('config:auth', 'json') : null;
        const targetPassword = (authConfig?.password || 'admin').trim();

        if (inputPassword !== targetPassword) {
          return new Response(JSON.stringify({ error: '安全核验失败：管理员密码输入错误' }), {
            status: 403,
            headers: corsHeaders,
          });
        }

        // Reset globalThis fallback
        globalThis.__EDGEPULSE_CONFIG__ = {
          title: 'EdgePulse Status',
          favicon: '',
          icp: '',
          sites: [],
          alerts: {},
          groups: ['default'],
        };

        if (kv) {
          await kv.delete('config');
          await kv.delete('status:snapshot');
        }

        return new Response(JSON.stringify({ success: true, message: '系统 KV 存储数据已彻底重置清空', config: globalThis.__EDGEPULSE_CONFIG__ }), {
          status: 200,
          headers: corsHeaders,
        });
      }

      // Fetch latest KV config before merging to ensure multi-isolate consistency
      let currentKVConfig = kv ? await kv.get('config', 'json') : null;
      if (!currentKVConfig) {
        currentKVConfig = globalThis.__EDGEPULSE_CONFIG__ || {
          title: 'EdgePulse Status',
          favicon: '/public/images/logo.svg',
          icp: '',
          sites: [],
          alerts: {},
          groups: ['default'],
        };
      }

      globalThis.__EDGEPULSE_CONFIG__ = {
        ...currentKVConfig,
        ...body,
      };

      const authData = {
        username: globalThis.__EDGEPULSE_AUTH_CONFIG__?.username || 'admin',
        password: globalThis.__EDGEPULSE_AUTH_CONFIG__?.password || 'admin',
        totpEnabled: !!body.totpEnabled,
        totpSecret: body.totpSecret || '',
        turnstileEnabled: !!body.turnstileEnabled,
        turnstileSiteKey: body.turnstileSiteKey || '',
        turnstileSecretKey: body.turnstileSecretKey || '',
      };

      globalThis.__EDGEPULSE_AUTH_CONFIG__ = authData;

      if (kv) {
        await kv.put('config', JSON.stringify(globalThis.__EDGEPULSE_CONFIG__));
        await kv.put('config:auth', JSON.stringify(authData));
        if (body.pages && Array.isArray(body.pages)) {
          for (const page of body.pages) {
            if (page.id) {
              await kv.put(`page:${page.id}`, JSON.stringify(page));
              if (page.domain) {
                const cleanDomain = page.domain.replace(/\s*\([^)]*\)/g, '').trim();
                if (cleanDomain) {
                  await kv.put(`domain:${cleanDomain}`, JSON.stringify({ pageId: page.id }));
                }
              }
            }
          }
        }
        if (body.domains && Array.isArray(body.domains)) {
          for (const item of body.domains) {
            await kv.put(`domain:${item.host}`, JSON.stringify({ pageId: item.pageId }));
          }
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'Configuration saved successfully', config: globalThis.__EDGEPULSE_CONFIG__ }), {
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
