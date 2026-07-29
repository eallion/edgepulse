/**
 * EdgeOne Edge Function: /api/auth/login
 * Handles Admin Login (Default: admin / admin)
 */

export async function onRequest(context) {
  return handleLogin(context);
}

export async function onRequestPost(context) {
  return handleLogin(context);
}

async function handleLogin(context) {
  const { request } = context;
  const kv = typeof MONITOR_KV !== 'undefined' ? MONITOR_KV : (typeof globalThis !== 'undefined' && globalThis.MONITOR_KV ? globalThis.MONITOR_KV : null);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body = await request.json();
    const inputUser = (body.username || '').trim();
    const inputPass = (body.password || '').trim();

    // Fetch stored auth info or default to admin / admin
    let authConfig = kv ? await kv.get('config:auth', 'json') : null;
    if (!authConfig || !authConfig.username) {
      authConfig = { username: 'admin', password: 'admin' };
    }

    const targetUser = (authConfig.username || 'admin').trim();
    const targetPass = (authConfig.password || 'admin').trim();

    if (inputUser === targetUser && inputPass === targetPass) {
      const token = btoa(`${inputUser}:${inputPass}:${Date.now()}`);
      return new Response(JSON.stringify({
        success: true,
        token,
        username: targetUser,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
