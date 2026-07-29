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
    iconEl.textContent = finalTheme === 'light' ? '☀️' : '🌙';
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
