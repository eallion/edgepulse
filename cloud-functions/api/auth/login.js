/**
 * EdgeOne Edge Function: /api/auth/login
 * Handles Admin Login with RFC 6238 TOTP 2FA & Cloudflare Turnstile Verification.
 */

export async function onRequest(context) {
  return handleLogin(context);
}

async function handleLogin(context) {
  const { request } = context;
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
    const body = await request.json();
    const inputUser = (body.username || '').trim();
    const inputPass = (body.password || '').trim();
    const totpCode = (body.totpCode || '').trim();
    const turnstileToken = (body.turnstileToken || '').trim();

    // Fetch auth config from KV or globalThis
    let authConfig = null;
    if (kv) {
      authConfig = await kv.get('config:auth', 'json');
      if (!authConfig) {
        const globalConfig = await kv.get('config', 'json');
        if (globalConfig) {
          authConfig = {
            username: globalConfig.username || 'admin',
            password: globalConfig.password || 'admin',
            totpEnabled: !!globalConfig.totpEnabled,
            totpSecret: globalConfig.totpSecret || '',
            turnstileEnabled: !!globalConfig.turnstileEnabled,
            turnstileSiteKey: globalConfig.turnstileSiteKey || '',
            turnstileSecretKey: globalConfig.turnstileSecretKey || '',
          };
        }
      }
    } else {
      authConfig = globalThis.__EDGEPULSE_AUTH_CONFIG__ || globalThis.__EDGEPULSE_CONFIG__ || {
        username: 'admin',
        password: 'admin',
      };
    }

    if (!authConfig) {
      authConfig = { username: 'admin', password: 'admin' };
    }

    // 1. Cloudflare Turnstile Validation (if enabled)
    if (authConfig.turnstileEnabled && authConfig.turnstileSecretKey) {
      if (!turnstileToken) {
        return new Response(JSON.stringify({ error: '请完成 Cloudflare Turnstile 人机验证' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (authConfig.turnstileSiteKey === '1x00000000000000000000AA') {
        // Always pass dev key
      } else if (authConfig.turnstileSiteKey === '2x00000000000000000000AB') {
        return new Response(JSON.stringify({ error: 'Dev Key 人机验证拦截强行失败测试' }), { status: 400 });
      } else {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: authConfig.turnstileSecretKey,
            response: turnstileToken,
            remoteip: request.headers.get('CF-Connecting-IP') || '',
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return new Response(JSON.stringify({ error: 'Turnstile 人机验证未通过' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
      }
    }

    // 2. Username & Password Validation
    const targetUser = (authConfig.username || 'admin').trim();
    const targetPass = (authConfig.password || 'admin').trim();

    if (inputUser !== targetUser || inputPass !== targetPass) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 3. 2FA TOTP Validation (if enabled)
    if (authConfig.totpEnabled && authConfig.totpSecret) {
      if (!totpCode || totpCode.length !== 6) {
        return new Response(JSON.stringify({ error: '该账号已开启 2FA，请输入 6 位动态验证码', requireTotp: true }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const isValid = await verifyTotpCode(authConfig.totpSecret, totpCode);
      if (!isValid) {
        return new Response(JSON.stringify({ error: '2FA 验证码错误或已过期，请重新输入', requireTotp: true }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

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

// RFC 6238 Base32 Decoder
function base32Decode(str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = [];

  const cleaned = (str || '').replace(/=+$/, '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

// RFC 6238 TOTP HMAC-SHA1 Validation (30s window)
async function verifyTotpCode(secret, userCode) {
  if (!secret || !userCode || userCode.length !== 6) return false;
  const keyBytes = base32Decode(secret);
  if (keyBytes.length === 0) return false;

  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  const currentCounter = Math.floor(epoch / timeStep);

  for (let offset = -1; offset <= 1; offset++) {
    const counter = currentCounter + offset;
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, counter, false);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
    const sigBytes = new Uint8Array(signature);
    const offsetByte = sigBytes[sigBytes.length - 1] & 0xf;
    const binary =
      ((sigBytes[offsetByte] & 0x7f) << 24) |
      ((sigBytes[offsetByte + 1] & 0xff) << 16) |
      ((sigBytes[offsetByte + 2] & 0xff) << 8) |
      (sigBytes[offsetByte + 3] & 0xff);

    const generatedCode = (binary % 1000000).toString().padStart(6, '0');
    if (generatedCode === userCode.trim()) {
      return true;
    }
  }

  return false;
}
