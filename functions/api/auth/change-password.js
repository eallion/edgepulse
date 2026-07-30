/**
 * EdgeOne Edge Function: /api/auth/change-password
 * Handles Password Modification
 */

export async function onRequest(context) {
  return handleChangePassword(context);
}

export async function onRequestPost(context) {
  return handleChangePassword(context);
}

async function handleChangePassword(context) {
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
    const { oldPassword, newUsername, newPassword } = body;

    let authConfig = kv ? await kv.get('config:auth', 'json') : null;
    if (!authConfig) {
      authConfig = { username: 'admin', password: 'admin' };
    }

    if (oldPassword !== authConfig.password) {
      return new Response(JSON.stringify({ error: '旧密码输入错误' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const updatedAuthConfig = {
      username: newUsername || authConfig.username,
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };

    if (kv) {
      await kv.put('config:auth', JSON.stringify(updatedAuthConfig));
    }

    return new Response(JSON.stringify({ success: true, message: '账号与密码修改成功，请重新登录' }), {
      status: 200,
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
