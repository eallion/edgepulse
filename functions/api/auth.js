/**
 * EdgeOne Edge Function: /api/auth
 * Authentication and Admin Account Management Endpoint.
 * Supports default admin/admin login and password update stored in KV.
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const kv = typeof MONITOR_KV !== 'undefined' ? MONITOR_KV : null;

  try {
    if (request.method === 'POST' && url.pathname.endsWith('/login')) {
      const body = await request.json();
      const { username, password } = body;

      // Fetch stored auth info or default to admin / admin
      let authConfig = kv ? await kv.get('config:auth', 'json') : null;
      if (!authConfig) {
        authConfig = { username: 'admin', password: 'admin' };
      }

      if (username === authConfig.username && password === authConfig.password) {
        // Simple token generation
        const token = btoa(`${username}:${password}:${Date.now()}`);
        return new Response(JSON.stringify({
          success: true,
          token,
          username: authConfig.username,
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
    }

    if (request.method === 'POST' && url.pathname.endsWith('/change-password')) {
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
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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
