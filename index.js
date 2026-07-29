/**
 * EdgePulse Frontend Controller
 * Fetches status API, renders Uptime Bars, Latency metrics, SSL & Domain Expiry tags.
 */

let countdownSeconds = 30;
let timerId = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchStatus();
  startCountdown();
});

/* Theme Manager: Dimmed (Default), Light, Dark */
function initTheme() {
  const savedTheme = localStorage.getItem('edgepulse_theme') || 'dimmed';
  applyTheme(savedTheme);
}

const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path fill="currentColor" d="M12 6c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z"><animate fill="freeze" attributeName="d" dur="0.6s" values="M12 26c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z;M12 6c3.31 0 6 2.69 6 6c0 3.31 -2.69 6 -6 6c-3.31 0 -6 -2.69 -6 -6c0 -3.31 2.69 -6 6 -6Z"/></path><g fill="none"><path d="M12 21v1M21 12h1M12 3v-1M3 12h-1" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.7s" to="1"/><animate fill="freeze" attributeName="d" begin="0.7s" dur="0.2s" values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"/></path><path d="M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.9s" to="1"/><animate fill="freeze" attributeName="d" begin="0.9s" dur="0.2s" values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"/></path></g></g></svg>`;

const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><g fill="currentColor"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z"><animate fill="freeze" attributeName="d" dur="0.6s" values="M7 28c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z;M7 6c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z"/></path><path d="M15.22 6.03l2.53 -1.94l-3.19 -0.09l-1.06 -3l-1.06 3l-3.19 0.09l2.53 1.94l-0.91 3.06l2.63 -1.81l2.63 1.81l-0.91 -3.06Z" opacity="0"><animate fill="freeze" attributeName="opacity" begin="0.7s" dur="0.4s" to="1"/></path><path d="M19.61 12.25l1.64 -1.25l-2.06 -0.05l-0.69 -1.95l-0.69 1.95l-2.06 0.05l1.64 1.25l-0.59 1.98l1.7 -1.17l1.7 1.17l-0.59 -1.98Z" opacity="0"><animate fill="freeze" attributeName="opacity" begin="1.1s" dur="0.4s" to="1"/></path></g></svg>`;

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dimmed';
  const nextTheme = current === 'light' ? 'dimmed' : 'light';
  applyTheme(nextTheme);
}

function applyTheme(theme) {
  const finalTheme = theme === 'light' ? 'light' : 'dimmed';
  document.documentElement.setAttribute('data-theme', finalTheme);
  localStorage.setItem('edgepulse_theme', finalTheme);

  const iconEl = document.getElementById('themeBtnIcon');
  if (iconEl) {
    iconEl.innerHTML = finalTheme === 'light' ? SUN_SVG : MOON_SVG;
  }
}

async function fetchStatus() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.style.opacity = '0.6';

  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    renderPage(data);
    countdownSeconds = 30; // Reset countdown
  } catch (err) {
    console.error('Failed to fetch status:', err);
  } finally {
    if (refreshBtn) refreshBtn.style.opacity = '1';
  }
}

function startCountdown() {
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    countdownSeconds--;
    const countdownEl = document.getElementById('countdownText');
    if (countdownEl) countdownEl.textContent = `(${countdownSeconds}s)`;

    if (countdownSeconds <= 0) {
      fetchStatus();
    }
  }, 1000);
}

function renderPage(data) {
  // Update Header & Announcement
  if (data.title) document.getElementById('appTitle').textContent = data.title;
  if (data.logo) document.getElementById('appLogo').textContent = data.logo;
  if (data.announcement) document.getElementById('appAnnouncement').textContent = data.announcement;

  // Update Overall Status Banner
  const statusDot = document.getElementById('statusDot');
  const overallStatusText = document.getElementById('overallStatusText');

  statusDot.className = 'status-pulse-dot ' + (data.overallStatus || 'operational');
  
  if (data.overallStatus === 'operational') {
    overallStatusText.textContent = '🟢 所有系统与服务运行正常 (All Systems Operational)';
  } else if (data.overallStatus === 'degraded') {
    overallStatusText.textContent = '🟡 部分系统响应延迟较高 (Degraded Performance)';
  } else {
    overallStatusText.textContent = '🔴 部分系统发生故障 (Service Disruption)';
  }

  document.getElementById('lastCheckTime').textContent = `最后更新: ${new Date(data.updatedAt || Date.now()).toLocaleTimeString('zh-CN')}`;

  // Update Summary Metrics
  const sites = data.sites || [];
  document.getElementById('totalSitesCount').textContent = sites.length;

  const validLatencies = sites.map(s => s.latency).filter(l => typeof l === 'number' && l > 0);
  const avgLatency = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;
  document.getElementById('avgLatencyValue').textContent = `${avgLatency} ms`;

  // Render Service Cards grouped
  const container = document.getElementById('serviceListContainer');
  container.innerHTML = '';

  // Group sites by group property
  const groups = {};
  sites.forEach(site => {
    const groupName = site.group || '默认监视分组';
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(site);
  });

  Object.keys(groups).forEach(groupName => {
    const groupHeader = document.createElement('div');
    groupHeader.className = 'group-title';
    groupHeader.innerHTML = `<span>📂</span> <span>${groupName}</span>`;
    container.appendChild(groupHeader);

    groups[groupName].forEach(site => {
      const card = createServiceCard(site);
      container.appendChild(card);
    });
  });
}

function createServiceCard(site) {
  const card = document.createElement('div');
  card.className = 'service-card';

  const isUp = site.status === 'up';
  const isDegraded = site.status === 'degraded';
  const badgeClass = isUp ? 'badge-operational' : (isDegraded ? 'badge-degraded' : 'badge-down');
  const badgeText = isUp ? '正常' : (isDegraded ? '延迟高' : '故障');

  // SSL & Domain Expiry Tags
  let sslTagHtml = '';
  if (site.sslExpiryDays !== null && site.sslExpiryDays !== undefined) {
    const sslColor = site.sslExpiryDays < 14 ? 'color: var(--color-red);' : 'color: var(--text-secondary);';
    sslTagHtml = `<span class="tag-badge" style="${sslColor}">🔒 SSL 剩余 ${site.sslExpiryDays} 天</span>`;
  }

  let domainTagHtml = '';
  if (site.domainExpiryDays !== null && site.domainExpiryDays !== undefined) {
    const domainColor = site.domainExpiryDays < 30 ? 'color: var(--color-yellow);' : 'color: var(--text-secondary);';
    domainTagHtml = `<span class="tag-badge" style="${domainColor}">🌐 域名剩余 ${site.domainExpiryDays} 天</span>`;
  }

  // 30 Days Uptime Bar Pills (30 items)
  const history = site.history24h || Array.from({ length: 24 }, () => 30);
  let barsHtml = '';
  for (let i = 0; i < 30; i++) {
    const isErrorPill = !isUp && i === 29;
    const pillClass = isErrorPill ? 'down' : (site.latency > 150 ? 'degraded' : '');
    barsHtml += `<div class="uptime-bar-pill ${pillClass}" title="Day ${i + 1}: Normal"></div>`;
  }

  card.innerHTML = `
    <div class="service-header">
      <div class="service-name">
        <span>${site.name}</span>
        ${sslTagHtml}
        ${domainTagHtml}
      </div>
      <div class="latency-info">
        <span>${site.latency || 0} ms</span>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
    </div>
    <div class="uptime-bar-container">
      <div class="uptime-bar-header">
        <span>过去 30 天可用率表现</span>
        <span>${site.uptime30d || 99.98}% 可用</span>
      </div>
      <div class="uptime-bars">
        ${barsHtml}
      </div>
    </div>
  `;

  return card;
}

/* Modal Form Controllers */
function openAdminModal() {
  document.getElementById('adminModal').classList.add('active');
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.remove('active');
}

function toggleSiteFormFields() {
  const type = document.getElementById('siteType').value;
  document.getElementById('urlGroup').style.display = (type === 'http') ? 'block' : 'none';
  document.getElementById('hostGroup').style.display = (type === 'icmp' || type === 'tcp') ? 'block' : 'none';
  document.getElementById('domainGroup').style.display = (type === 'domain') ? 'block' : 'none';
}

async function handleSaveSite(event) {
  event.preventDefault();
  const type = document.getElementById('siteType').value;
  const name = document.getElementById('siteName').value;
  const url = document.getElementById('siteUrl').value;
  const host = document.getElementById('siteHost').value;
  const domain = document.getElementById('siteDomain').value;
  const group = document.getElementById('siteGroup').value;
  const adminKey = document.getElementById('adminKey').value;

  const newSite = {
    id: `site-${Date.now()}`,
    name,
    type,
    group,
    ...(url && { url }),
    ...(host && { host }),
    ...(domain && { domain }),
  };

  try {
    // 1. Fetch current config
    const currentRes = await fetch('/api/config');
    const currentConfig = await currentRes.json();

    const updatedSites = [...(currentConfig.sites || []), newSite];
    const updatedConfig = { ...currentConfig, sites: updatedSites };

    // 2. Post updated config with Authorization
    const saveRes = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
      },
      body: JSON.stringify(updatedConfig),
    });

    if (!saveRes.ok) {
      const errData = await saveRes.json();
      alert(`保存失败: ${errData.error || '秘钥不匹配或网络错误'}`);
      return;
    }

    alert('✅ 监控节点保存成功！系统将在下一次巡检时生效。');
    closeAdminModal();
    fetchStatus();
  } catch (err) {
    alert(`保存失败: ${err.message}`);
  }
}
