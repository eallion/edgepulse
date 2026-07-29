/**
 * EdgeOne Edge Function: /api/push
 * Passive Heartbeat Check-in Endpoint (Dead Man's Snitch)
 * Accepts ping from external servers/cron scripts via URL token.
 * Usage: GET /api/push?token=vps-01-key&latency=15
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const latency = parseInt(url.searchParams.get('latency') || '10', 10);
  const kv = typeof MONITOR_KV !== 'undefined' ? MONITOR_KV : null;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (kv) {
      const snapshot = (await kv.get('status:snapshot', 'json')) || {};
      
      // Update site push status
      snapshot[token] = {
        status: 'up',
        latency,
        lastChecked: new Date().toISOString(),
        errorMsg: null,
        history24h: [...(snapshot[token]?.history24h || Array(24).fill(20)).slice(1), latency],
      };

      await kv.put('status:snapshot', JSON.stringify(snapshot));
    }

    return new Response(JSON.stringify({ success: true, token, receivedAt: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
