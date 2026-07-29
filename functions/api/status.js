/**
 * EdgeOne Edge Function: /api/status
 * Serves current status, uptime SLA %, and 24h history metrics to the frontend UI.
 * Supports Multi-Domain matching via request Host header and fallback for dev server persistence.
 */

export async function onRequest(context) {
  return handleStatusRequest(context);
}

export async function onRequestGet(context) {
  return handleStatusRequest(context);
}

async function handleStatusRequest(context) {
  try {
    const request = context?.request || {};
    const url = request.url ? new URL(request.url) : new URL('http://localhost');
    const host = (request.headers && request.headers.get('host')) || url.hostname;
    const kv = typeof MONITOR_KV !== 'undefined' ? MONITOR_KV : (typeof globalThis !== 'undefined' && globalThis.MONITOR_KV ? globalThis.MONITOR_KV : null);

    let globalConfig = null;
    let pageConfig = null;
    let sites = [];
    let statusMap = {};

    if (kv) {
      // 1. Fetch main configuration
      globalConfig = await kv.get('config', 'json');

      // 2. Multi-domain lookup: check if current Host header is mapped to a specific page group
      const domainMapping = await kv.get(`domain:${host}`, 'json');
      if (domainMapping && domainMapping.pageId) {
        pageConfig = await kv.get(`page:${domainMapping.pageId}`, 'json');
      }

      // If no domain mapping, fallback to default page config or global config
      if (!pageConfig) {
        pageConfig = await kv.get('page:default', 'json') || {
          id: 'default',
          title: globalConfig?.title || 'EdgePulse System Status',
          logo: globalConfig?.logo || '',
          announcement: globalConfig?.announcement || '',
          siteIds: [], // Empty means show all
        };
      }

      // 3. Fetch latest status snapshot
      statusMap = (await kv.get('status:snapshot', 'json')) || {};
      
      // 4. Filter sites belonging to this status page
      const allSites = globalConfig?.sites || getMockSites();
      if (pageConfig.siteIds && pageConfig.siteIds.length > 0) {
        sites = allSites.filter(s => pageConfig.siteIds.includes(s.id));
      } else {
        sites = allSites;
      }
    } else {
      // Local dev server fallback: try fetching /api/config internally
      try {
        const internalConfigRes = await fetch(new URL('/api/config', url.origin).toString());
        if (internalConfigRes.ok) {
          globalConfig = await internalConfigRes.json();
        }
      } catch (e) {}

      pageConfig = {
        title: globalConfig?.title || 'EdgePulse System Status',
        logo: globalConfig?.logo || '',
        announcement: globalConfig?.announcement || '',
      };
      sites = globalConfig?.sites || getMockSites();
    }

    // Process site metrics
    const resultSites = sites.map(site => {
      const snap = statusMap[site.id] || { status: 'operational', latency: 42, history: [] };
      return {
        ...site,
        status: snap.status || 'operational',
        latency: snap.latency || 42,
        history: snap.history || getMockHistory(),
      };
    });

    let overallStatus = 'operational';
    if (resultSites.some(s => s.status === 'down')) {
      overallStatus = 'down';
    } else if (resultSites.some(s => s.status === 'degraded')) {
      overallStatus = 'degraded';
    }

    const payload = {
      title: pageConfig.title,
      logo: pageConfig.logo || '',
      announcement: pageConfig.announcement || '',
      icp: globalConfig?.icp || '',
      overallStatus,
      updatedAt: new Date().toISOString(),
      sites: resultSites,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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

function getMockSites() {
  return [
    { id: 'site-1', name: '官网主站 (Main Web)', type: 'http', url: 'https://demo.eallion.com', group: 'default', checkDomain: true, checkSsl: true },
    { id: 'site-2', name: 'API 网关服务', type: 'http', url: 'https://demo.eallion.com/api/status', group: 'default', checkDomain: false, checkSsl: true },
    { id: 'site-3', name: '香港 VPS 探针', type: 'icmp', host: '1.1.1.1', group: 'default', checkDomain: false, checkSsl: false }
  ];
}

function getMockHistory() {
  const history = [];
  for (let i = 0; i < 30; i++) {
    history.push({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      status: 'operational',
      uptimePct: 100,
    });
  }
  return history;
}
