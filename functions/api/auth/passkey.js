/**
 * EdgeOne Edge Function: /api/auth/passkey
 * WebAuthn Passkey Registration & Authentication Endpoint.
 * Supports Bitwarden, TouchID, FaceID, YubiKey credentials.
 */

export async function onRequest(context) {
  return handlePasskey(context);
}

export async function onRequestPost(context) {
  return handlePasskey(context);
}

async function handlePasskey(context) {
  const { request } = context;
  const url = new URL(request.url);
  const kv = typeof MONITOR_KV !== 'undefined' ? MONITOR_KV : (typeof globalThis !== 'undefined' && globalThis.MONITOR_KV ? globalThis.MONITOR_KV : null);

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
    const action = url.pathname.split('/').pop();

    if (action === 'challenge') {
      // Challenge for register or login
      const challenge = crypto.randomUUID();
      return new Response(JSON.stringify({ challenge }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (action === 'register') {
      const body = await request.json();
      const { credential } = body;

      if (!credential || !credential.id) {
        return new Response(JSON.stringify({ error: '无效的 Passkey 凭据数据' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      let authConfig = kv ? await kv.get('config:auth', 'json') : null;
      if (!authConfig) authConfig = { username: 'admin', password: 'admin' };

      const passkeys = authConfig.passkeys || [];
      passkeys.push({
        id: credential.id,
        rawId: credential.rawId,
        type: credential.type,
        createdAt: new Date().toISOString(),
      });

      authConfig.passkeys = passkeys;
      if (kv) await kv.put('config:auth', JSON.stringify(authConfig));

      return new Response(JSON.stringify({ success: true, message: 'Passkey 设备注册成功' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (action === 'verify') {
      const body = await request.json();
      const { credential } = body;

      let authConfig = kv ? await kv.get('config:auth', 'json') : null;
      if (!authConfig) authConfig = { username: 'admin', password: 'admin' };

      const passkeys = authConfig.passkeys || [];
      const match = passkeys.find(p => p.id === credential.id);

      if (match) {
        const token = btoa(`${authConfig.username}:${authConfig.password}:${Date.now()}`);
        return new Response(JSON.stringify({
          success: true,
          token,
          username: authConfig.username,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify({ error: '未识别的 Passkey 设备' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown passkey action' }), { status: 400 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
