/**
 * EdgeOne Edge Function: /api/status
 * Serves current status, uptime SLA %, and 24h history metrics to the frontend UI.
 * Connects seamlessly to globalThis singleton for local dev server persistence.
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
      // 1. Fetch main configuration from KV
      globalConfig = await kv.get('config', 'json');

      // 2. Multi-domain lookup
      const domainMapping = await kv.get(`domain:${host}`, 'json');
      if (domainMapping && domainMapping.pageId) {
        pageConfig = await kv.get(`page:${domainMapping.pageId}`, 'json');
      }

      if (!pageConfig) {
        pageConfig = await kv.get('page:default', 'json') || {
          id: 'default',
          title: globalConfig?.title || 'EdgePulse Status',
          logo: globalConfig?.logo || '',
          announcement: globalConfig?.announcement || '',
          siteIds: [],
        };
      }

      statusMap = (await kv.get('status:snapshot', 'json')) || {};
      
      const allSites = globalConfig?.sites || [];
      const isDefaultPage = !pageConfig || pageConfig.id === 'default' || pageConfig.isDefault;
      
      if (!isDefaultPage && pageConfig.siteIds && Array.isArray(pageConfig.siteIds) && pageConfig.siteIds.length > 0) {
        sites = allSites.filter(s => pageConfig.siteIds.includes(s.id));
        if (sites.length === 0) sites = allSites;
      } else {
        sites = allSites;
      }
    } else {
      // Dev server fallback: read from globalThis singleton
      globalConfig = globalThis.__EDGEPULSE_CONFIG__ || {
        title: 'EdgePulse Status',
        sites: [],
      };

      const matchedPage = (globalConfig.pages || []).find(p => {
        if (!p.domain) return false;
        const target = p.domain.toLowerCase();
        const currentHost = host.toLowerCase();
        const currentHostname = url.hostname.toLowerCase();
        return target === currentHost || target.startsWith(currentHost) || target === currentHostname || p.id === 'default' || p.isDefault;
      });

      pageConfig = matchedPage || {
        title: globalConfig.title || 'EdgePulse Status',
        logo: globalConfig.logo || '',
        announcement: globalConfig.announcement || '',
      };

      const allSites = globalConfig.sites && globalConfig.sites.length > 0 ? globalConfig.sites : [];
      const isDefaultPage = !pageConfig || pageConfig.id === 'default' || pageConfig.isDefault;

      if (!isDefaultPage && pageConfig.siteIds && Array.isArray(pageConfig.siteIds) && pageConfig.siteIds.length > 0) {
        sites = allSites.filter(s => pageConfig.siteIds.includes(s.id));
        if (sites.length === 0) sites = allSites;
      } else {
        sites = allSites;
      }
    }

    // Helper function to build 30-day real history array
    function build30DaysHistory(snap, currentStatus) {
      const history = [];
      const now = Date.now();
      const dailyMap = snap?.dailyStatusMap || {};

      for (let i = 0; i < 30; i++) {
        const d = new Date(now - (29 - i) * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        const dayRecord = dailyMap[dateStr];

        let dayStatus = 'operational';
        let uptimePct = 100;

        if (dayRecord && dayRecord.total > 0) {
          uptimePct = Math.round((dayRecord.up / dayRecord.total) * 100);
          if (dayRecord.up === 0) dayStatus = 'down';
          else if (dayRecord.up < dayRecord.total) dayStatus = 'degraded';
          else dayStatus = 'operational';
        } else if (i === 29) {
          dayStatus = currentStatus === 'down' ? 'down' : (currentStatus === 'degraded' ? 'degraded' : 'operational');
          uptimePct = currentStatus === 'down' ? 0 : 100;
        }

        history.push({
          date: dateStr,
          status: dayStatus,
          uptimePct,
        });
      }
      return history;
    }

    // Process site metrics & dynamic page group assignment
    const resultSites = sites.map(site => {
      const snap = statusMap[site.id] || null;
      
      let assignedGroup = '默认监视分组';
      if (pageConfig.groupSites && Object.keys(pageConfig.groupSites).length > 0) {
        for (const [gName, sIds] of Object.entries(pageConfig.groupSites)) {
          if (Array.isArray(sIds) && sIds.includes(site.id)) {
            assignedGroup = gName;
            break;
          }
        }
      }

      const realStatus = snap ? (snap.status === 'up' ? 'operational' : snap.status) : 'operational';
      const realLatency = snap ? (snap.latency || 0) : 0;
      const realUptime30d = snap ? (snap.uptime30d ?? 100) : 100;
      const realHistory = build30DaysHistory(snap, realStatus);

      return {
        ...site,
        group: assignedGroup,
        status: realStatus,
        latency: realLatency,
        uptime30d: realUptime30d,
        history: realHistory,
        lastChecked: snap?.lastChecked || null,
        errorMsg: snap?.errorMsg || null,
      };
    });

    let overallStatus = 'operational';
    if (resultSites.some(s => s.status === 'down')) {
      overallStatus = 'down';
    } else if (resultSites.some(s => s.status === 'degraded')) {
      overallStatus = 'degraded';
    }

    const payload = {
      title: pageConfig.title || globalConfig?.title || 'EdgePulse Status',
      logo: pageConfig.logo || '',
      announcement: pageConfig.announcement || '',
      icp: globalConfig?.icp || '',
      favicon: globalConfig?.favicon || '',
      historyDays: globalConfig?.historyDays || 30,
      refreshInterval: globalConfig?.refreshInterval || 30,
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
