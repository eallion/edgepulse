/**
 * EdgePulse Frontend Controller
 * Fetches status API, renders Uptime Bars, Sparkline mini charts, SSL & Domain Expiry tags.
 */

let defaultRefreshInterval = 30;
let countdownSeconds = 30;
let timerId = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchStatus();
  startCountdown();
});

function formatCountdownText(sec) {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${sec}s`;
}

/* Theme Manager: Dimmed (Default), Light */
function initTheme() {
  const savedTheme = localStorage.getItem('edgepulse_theme') || 'dimmed';
  applyTheme(savedTheme);
}

const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;

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
  const refreshBtn = document.getElementById('footerRefreshBtn');
  if (refreshBtn) refreshBtn.style.opacity = '0.6';

  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    defaultRefreshInterval = data.refreshInterval || 30;
    renderPage(data);
    countdownSeconds = defaultRefreshInterval;
  } catch (err) {
    console.error('Failed to fetch status:', err);
  } finally {
    if (refreshBtn) refreshBtn.style.opacity = '1';
  }
}

function manualRefresh() {
  fetchStatus();
}

function startCountdown() {
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    countdownSeconds--;
    const countdownEl = document.getElementById('countdownText');
    if (countdownEl) countdownEl.textContent = `刷新 (${formatCountdownText(countdownSeconds)})`;

    if (countdownSeconds <= 0) {
      fetchStatus();
    }
  }, 1000);
}

function renderPage(data) {
  // Update Title & Favicon
  if (data.title) {
    document.title = data.title;
    const titleEl = document.getElementById('appTitle');
    if (titleEl) titleEl.textContent = data.title;
  }

  if (data.favicon) {
    const favEl = document.getElementById('siteFavicon');
    if (favEl) favEl.href = data.favicon;
  }

  if (data.logo) {
    const logoEl = document.getElementById('appLogo');
    if (logoEl) {
      if (logoEl.tagName === 'IMG') {
        logoEl.src = data.logo;
      } else {
        logoEl.textContent = data.logo;
      }
    }
  }
  
  if (data.announcement) {
    const annEl = document.getElementById('appAnnouncement');
    if (annEl) annEl.textContent = data.announcement;
  }

  // Update ICP License in Footer
  const icpContainer = document.getElementById('icpContainer');
  const icpText = document.getElementById('icpText');
  if (data.icp && data.icp.trim()) {
    if (icpText) icpText.innerHTML = `<img src="/public/images/icp.webp" width="14" height="14" style="vertical-align: -0.15em; margin-right: 0.25rem; object-fit: contain;">${data.icp.trim()}`;
    if (icpContainer) icpContainer.style.display = 'inline';
  } else {
    if (icpContainer) icpContainer.style.display = 'none';
  }

  // Update Overall Status Banner
  const statusDot = document.getElementById('statusDot');
  const overallStatusText = document.getElementById('overallStatusText');

  statusDot.className = 'status-pulse-dot ' + (data.overallStatus || 'operational');
  
  if (data.overallStatus === 'operational') {
    overallStatusText.textContent = '所有系统与服务运行正常';
  } else if (data.overallStatus === 'degraded') {
    overallStatusText.textContent = '部分服务响应延迟';
  } else {
    overallStatusText.textContent = '部分服务发生故障';
  }

  document.getElementById('lastCheckTime').textContent = `最后更新: ${new Date(data.updatedAt || Date.now()).toLocaleTimeString('zh-CN')}`;

  const historyDays = data.historyDays || 30;

  // Update Summary Metrics
  const sites = data.sites || [];
  document.getElementById('totalSitesCount').textContent = sites.length;

  const validLatencies = sites.map(s => s.latency).filter(l => typeof l === 'number' && l > 0);
  const avgLatency = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;
  document.getElementById('avgLatencyValue').textContent = `${avgLatency} ms`;
  
  const slaLabelEl = document.querySelector('.metric-inline-item:last-child .metric-inline-label');
  if (slaLabelEl) slaLabelEl.textContent = `${historyDays} 天可用率`;

  // Render Service Cards grouped
  const container = document.getElementById('serviceListContainer');
  container.innerHTML = '';

  if (sites.length === 0) {
    container.innerHTML = `
      <div class="service-card" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; display: flex; justify-content: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-accent)"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg></div>
        <div style="font-size: 1rem; color: var(--text-secondary); font-weight: 500;">尚未建立任何监控节点</div>
        <div style="font-size: 0.85rem; margin-top: 0.25rem;">登录控制台后台添加您的第一个网站或探针</div>
      </div>
    `;
    return;
  }

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
    groupHeader.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> <span>${groupName}</span>`;
    container.appendChild(groupHeader);

    groups[groupName].forEach(site => {
      const card = createServiceCard(site, historyDays);
      container.appendChild(card);
    });
  });
}

function generateSparklineSvg(history) {
  if (!history || history.length < 2) {
    history = [28, 30, 26, 32, 29, 31, 27, 30];
  }
  const max = Math.max(...history, 50);
  const min = Math.min(...history, 0);
  const range = max - min || 1;
  const width = 70;
  const height = 20;

  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return `
    <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}">
      <polyline
        fill="none"
        stroke="var(--color-accent)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        points="${points}"
      />
    </svg>
  `;
}

function createServiceCard(site, historyDays = 30) {
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
    sslTagHtml = `<span class="tag-badge" style="${sslColor}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.2rem;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>SSL 剩 ${site.sslExpiryDays} 天</span>`;
  }

  let domainTagHtml = '';
  if (site.domainExpiryDays !== null && site.domainExpiryDays !== undefined) {
    const domainColor = site.domainExpiryDays < 30 ? 'color: var(--color-yellow);' : 'color: var(--text-secondary);';
    domainTagHtml = `<span class="tag-badge" style="${domainColor}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.2rem;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>域名剩 ${site.domainExpiryDays} 天</span>`;
  }

  // Type Icon
  let typeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  if (site.type === 'icmp') {
    typeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><path d="M4.93 4.93A10 10 0 0 1 19.07 4.93"/><path d="M7.76 7.76a6 6 0 0 1 8.48 0"/><circle cx="12" cy="12" r="2"/></svg>`;
  } else if (site.type === 'tcp') {
    typeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;
  } else if (site.type === 'push') {
    typeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  }

  // Dynamic Uptime Bar Pills (30/60/90/180)
  let barsHtml = '';
  for (let i = 0; i < historyDays; i++) {
    const isErrorPill = !isUp && i === (historyDays - 1);
    const pillClass = isErrorPill ? 'down' : (site.latency > 150 ? 'degraded' : '');
    barsHtml += `<div class="uptime-bar-pill ${pillClass}" title="Day ${i + 1}: ${isErrorPill ? 'Disruption' : 'Operational'}"></div>`;
  }

  const sparklineHtml = generateSparklineSvg(site.history24h);

  card.innerHTML = `
    <div class="service-header">
      <div class="service-name">
        <span>${typeIcon} ${site.name}</span>
        ${sslTagHtml}
        ${domainTagHtml}
      </div>
      <div class="sparkline-container">
        ${sparklineHtml}
        <div class="latency-info">
          <span style="font-family: var(--font-mono); font-weight: 600;">${site.latency || 0} ms</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
      </div>
    </div>
    <div class="uptime-bar-container">
      <div class="uptime-bar-header">
        <span>过去 ${historyDays} 天可用率表现</span>
        <span style="font-family: var(--font-mono);">${site.uptime30d || 99.98}% 可用</span>
      </div>
      <div class="uptime-bars">
        ${barsHtml}
      </div>
    </div>
  `;

  return card;
}
