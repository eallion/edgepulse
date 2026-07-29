/**
 * EdgePulse Admin Dashboard Logic
 * Handles Authentication, Settings, Site CRUD, Apex/Subdomain hierarchy detection,
 * Expiry frequencies (daily/weekly), and custom threshold notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  onUrlOrHostInput();
});

/* Shared Theme Manager: Dimmed (Default), Light, Dark */
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

function checkAuth() {
  const token = sessionStorage.getItem('edgepulse_token');
  const username = sessionStorage.getItem('edgepulse_username') || 'admin';

  if (token) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('currentUserBadge').textContent = `当前登录账号: ${username}`;
    loadConfig();
  } else {
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('dashboardView').style.display = 'none';
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`登录失败: ${data.error || '用户名或密码错误'}`);
      return;
    }

    sessionStorage.setItem('edgepulse_token', data.token);
    sessionStorage.setItem('edgepulse_username', data.username);
    checkAuth();
  } catch (err) {
    alert(`登录异常: ${err.message}`);
  }
}

function handleLogout() {
  sessionStorage.removeItem('edgepulse_token');
  sessionStorage.removeItem('edgepulse_username');
  checkAuth();
}

function switchTab(tabName) {
  const tabs = ['sites', 'addSite', 'settings'];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`tab-${t}`);
    if (tabEl) tabEl.style.display = t === tabName ? 'block' : 'none';
  });

  const tabItems = document.querySelectorAll('.tab-item');
  tabItems.forEach((el, idx) => {
    if (el) el.classList.toggle('active', tabs[idx] === tabName);
  });
}

function toggleAdminFormFields() {
  const type = document.getElementById('newSiteType').value;
  document.getElementById('adminUrlGroup').style.display = (type === 'http') ? 'block' : 'none';
  document.getElementById('adminHostGroup').style.display = (type === 'icmp' || type === 'tcp') ? 'block' : 'none';
  document.getElementById('adminDomainGroup').style.display = (type === 'domain') ? 'block' : 'none';
  document.getElementById('expiryMonitorPanel').style.display = (type === 'http' || type === 'domain') ? 'block' : 'none';
  onUrlOrHostInput();
}

/**
 * Intelligent Domain Hierarchy Detection (Apex/Root vs Subdomain)
 */
function isRootDomain(hostname) {
  if (!hostname) return false;
  const clean = hostname.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  const parts = clean.split('.');
  if (parts.length <= 2) return true;
  
  // Handling common ccTLDs like .com.cn, .co.uk
  const cctlds = ['com.cn', 'net.cn', 'org.cn', 'co.uk', 'gov.cn'];
  const lastTwo = parts.slice(-2).join('.');
  if (cctlds.includes(lastTwo) && parts.length === 3) return true;

  return false;
}

function onUrlOrHostInput() {
  const siteUrlEl = document.getElementById('siteUrl');
  const siteDomainEl = document.getElementById('siteDomain');
  const badgeEl = document.getElementById('domainLevelBadge');
  const chkDomainItem = document.getElementById('chkDomainItem');
  const domainWarnDaysGroup = document.getElementById('domainWarnDaysGroup');

  if (!siteUrlEl || !badgeEl) return;

  const urlVal = siteUrlEl.value || '';
  const domainVal = siteDomainEl ? siteDomainEl.value || '' : '';
  const targetStr = urlVal || domainVal || '';

  let hostname = '';
  try {
    hostname = targetStr.includes('://') ? new URL(targetStr).hostname : targetStr.split('/')[0].split(':')[0];
  } catch (e) {
    hostname = targetStr;
  }

  const isApex = isRootDomain(hostname);

  if (isApex && hostname) {
    badgeEl.textContent = '根域名 (Apex Domain)';
    badgeEl.style.color = 'var(--color-green)';
    if (chkDomainItem) chkDomainItem.style.display = 'flex';
    if (domainWarnDaysGroup) domainWarnDaysGroup.style.display = 'block';
  } else if (hostname) {
    badgeEl.textContent = '子域名 (Subdomain - 仅监控 SSL 证书)';
    badgeEl.style.color = 'var(--color-accent)';
    if (chkDomainItem) chkDomainItem.style.display = 'none';
    if (domainWarnDaysGroup) domainWarnDaysGroup.style.display = 'none';
    const chkEnableDomain = document.getElementById('chkEnableDomainExpiry');
    if (chkEnableDomain) chkEnableDomain.checked = false;
  } else {
    badgeEl.textContent = '识别中...';
    badgeEl.style.color = 'var(--text-muted)';
  }
}

let cachedConfig = { sites: [], alerts: {}, groups: [] };

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    cachedConfig = await res.json();
    
    renderSitesTable(cachedConfig.sites || []);
    fillSettingsForm(cachedConfig);
    updateAvailableChannelsAndGroups(cachedConfig);
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function renderSitesTable(sites) {
  const tbody = document.getElementById('sitesTableBody');
  tbody.innerHTML = '';

  if (sites.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">暂无监控节点，请在【➕ 添加监控节点】中添加</td></tr>';
    return;
  }

  sites.forEach((site, index) => {
    const tr = document.createElement('tr');
    const channelsText = (site.alertChannels && site.alertChannels.length > 0) 
      ? site.alertChannels.map(getChannelLabel).join(', ') 
      : '无 (跟随默认)';

    // Expiry Rule summary text
    let expiryRulesText = [];
    if (site.checkDomain) expiryRulesText.push(`域名到期 (${site.domainWarnDays || 30}d)`);
    if (site.checkSsl) expiryRulesText.push(`SSL到期 (${site.sslWarnDays || 14}d)`);
    const freqText = site.expiryFrequency === 'weekly' ? '每周' : '每天';
    const rulesSummary = expiryRulesText.length > 0 ? `${expiryRulesText.join(' + ')} [${freqText}]` : '未开启到期监控';

    tr.innerHTML = `
      <td><strong>${site.name}</strong></td>
      <td><span class="badge badge-operational">${site.type.toUpperCase()}</span></td>
      <td>${site.url || site.host || site.domain || '-'}</td>
      <td>${site.group || '默认分组'}</td>
      <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${rulesSummary}</span></td>
      <td><span style="font-size: 0.8rem; color: var(--color-accent);">${channelsText}</span></td>
      <td>
        <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--color-red);" onclick="deleteSite(${index})">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getChannelLabel(key) {
  const map = { lark: '飞书', wechat: '企业微信', dingtalk: '钉钉', telegram: 'Telegram', bark: 'Bark', email: 'Email' };
  return map[key] || key;
}

let activeGroupsList = ['核心服务', '网站节点', 'VPS 服务器', '域名资产'];

function fillSettingsForm(config) {
  const alerts = config.alerts || {};
  if (alerts.larkWebhook) document.getElementById('settingLark').value = alerts.larkWebhook;
  if (alerts.wechatWebhook) document.getElementById('settingWechat').value = alerts.wechatWebhook;
  if (alerts.dingtalkWebhook) document.getElementById('settingDingtalk').value = alerts.dingtalkWebhook;
  if (alerts.telegramToken && alerts.telegramChatId) {
    document.getElementById('settingTelegram').value = `${alerts.telegramToken}|${alerts.telegramChatId}`;
  }
  if (alerts.barkUrl) document.getElementById('settingBark').value = alerts.barkUrl;
  
  if (alerts.email) {
    if (alerts.email.smtpHost) document.getElementById('settingSmtpHost').value = alerts.email.smtpHost;
    if (alerts.email.smtpPort) document.getElementById('settingSmtpPort').value = alerts.email.smtpPort;
    if (alerts.email.smtpUser) document.getElementById('settingSmtpUser').value = alerts.email.smtpUser;
    if (alerts.email.smtpPass) document.getElementById('settingSmtpPass').value = alerts.email.smtpPass;
    if (alerts.email.receiver) document.getElementById('settingEmailReceiver').value = alerts.email.receiver;
  }

  activeGroupsList = config.groups || ['核心服务', '网站节点', 'VPS 服务器', '域名资产'];
  renderGroupTags();
}

function renderGroupTags() {
  const container = document.getElementById('groupTagContainer');
  if (!container) return;
  container.innerHTML = '';

  if (activeGroupsList.length === 0) {
    container.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">暂无分组，请在下方输入框添加</span>';
    return;
  }

  activeGroupsList.forEach((group, index) => {
    const tag = document.createElement('span');
    tag.className = 'checkbox-item';
    tag.style.display = 'inline-flex';
    tag.style.alignItems = 'center';
    tag.style.gap = '0.4rem';
    tag.innerHTML = `
      <span>📁 ${group}</span>
      <span onclick="removeGroupTag(${index})" title="删除分组" style="cursor: pointer; color: var(--color-red); font-weight: bold; margin-left: 0.3rem; padding: 0 0.2rem;">✕</span>
    `;
    container.appendChild(tag);
  });
}

function addNewGroupTag() {
  const inputEl = document.getElementById('newGroupInput');
  const val = inputEl ? inputEl.value.trim() : '';

  if (!val) return;
  if (activeGroupsList.includes(val)) {
    alert('该分组已存在');
    return;
  }

  activeGroupsList.push(val);
  inputEl.value = '';
  renderGroupTags();
}

function removeGroupTag(index) {
  activeGroupsList.splice(index, 1);
  renderGroupTags();
}

function updateAvailableChannelsAndGroups(config) {
  const alerts = config.alerts || {};
  const channelContainer = document.getElementById('availableAlertChannels');
  channelContainer.innerHTML = '';

  const configuredChannels = [];
  if (alerts.larkWebhook) configuredChannels.push({ id: 'lark', label: '🟦 飞书' });
  if (alerts.wechatWebhook) configuredChannels.push({ id: 'wechat', label: '🟩 企业微信' });
  if (alerts.dingtalkWebhook) configuredChannels.push({ id: 'dingtalk', label: '🍊 钉钉' });
  if (alerts.telegramToken) configuredChannels.push({ id: 'telegram', label: '✈️ Telegram' });
  if (alerts.barkUrl) configuredChannels.push({ id: 'bark', label: '📱 Bark (iOS)' });
  if (alerts.email && alerts.email.receiver) configuredChannels.push({ id: 'email', label: '✉️ Email 邮件' });

  if (configuredChannels.length === 0) {
    channelContainer.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">暂未配置任何通知通道，请在【⚙️ 设置】中填入告警信息</span>';
  } else {
    configuredChannels.forEach(ch => {
      const item = document.createElement('label');
      item.className = 'checkbox-item';
      item.innerHTML = `<input type="checkbox" name="alertChannel" value="${ch.id}" checked> <span>${ch.label}</span>`;
      channelContainer.appendChild(item);
    });
  }

  const groupSelect = document.getElementById('newSiteGroupSelect');
  groupSelect.innerHTML = '';
  const groups = config.groups || ['核心服务', '网站节点', 'VPS 服务器', '域名资产'];
  groups.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.trim();
    opt.textContent = g.trim();
    groupSelect.appendChild(opt);
  });
}

async function handleCreateSite(event) {
  event.preventDefault();
  const token = sessionStorage.getItem('edgepulse_token');
  const type = document.getElementById('newSiteType').value;
  const name = document.getElementById('newSiteName').value;
  const url = document.getElementById('newSiteUrl').value;
  const host = document.getElementById('newSiteHost').value;
  const domain = document.getElementById('newSiteDomain').value;
  const group = document.getElementById('newSiteGroupSelect').value;

  const checkDomain = document.getElementById('chkEnableDomainExpiry').checked;
  const checkSsl = document.getElementById('chkEnableSslExpiry').checked;
  const expiryFrequency = document.getElementById('expiryFrequency').value;
  const domainWarnDays = parseInt(document.getElementById('domainWarnDays').value || '30', 10);
  const sslWarnDays = parseInt(document.getElementById('sslWarnDays').value || '14', 10);

  const selectedChannels = Array.from(document.querySelectorAll('input[name="alertChannel"]:checked')).map(el => el.value);

  const newSite = {
    id: `site-${Date.now()}`,
    name,
    type,
    group,
    checkDomain,
    checkSsl,
    expiryFrequency,
    domainWarnDays,
    sslWarnDays,
    alertChannels: selectedChannels,
    ...(url && { url }),
    ...(host && { host }),
    ...(domain && { domain }),
  };

  const updatedConfig = {
    ...cachedConfig,
    sites: [...(cachedConfig.sites || []), newSite],
  };

  await saveConfig(updatedConfig, token, '✅ 监控节点添加成功！');
  switchTab('sites');
}

async function deleteSite(index) {
  if (!confirm('确定要删除该监控节点吗？')) return;
  const token = sessionStorage.getItem('edgepulse_token');
  const updatedSites = [...cachedConfig.sites];
  updatedSites.splice(index, 1);

  const updatedConfig = { ...cachedConfig, sites: updatedSites };
  await saveConfig(updatedConfig, token, '✅ 监控节点已删除！');
}

async function handleSaveSettings(event) {
  event.preventDefault();
  const token = sessionStorage.getItem('edgepulse_token');

  const tgValue = document.getElementById('settingTelegram').value.split('|');
  const alerts = {
    larkWebhook: document.getElementById('settingLark').value,
    wechatWebhook: document.getElementById('settingWechat').value,
    dingtalkWebhook: document.getElementById('settingDingtalk').value,
    telegramToken: tgValue[0] ? tgValue[0].trim() : '',
    telegramChatId: tgValue[1] ? tgValue[1].trim() : '',
    barkUrl: document.getElementById('settingBark').value,
    email: {
      smtpHost: document.getElementById('settingSmtpHost').value,
      smtpPort: document.getElementById('settingSmtpPort').value,
      smtpUser: document.getElementById('settingSmtpUser').value,
      smtpPass: document.getElementById('settingSmtpPass').value,
      receiver: document.getElementById('settingEmailReceiver').value,
    },
  };

  const groups = activeGroupsList;

  const updatedConfig = { ...cachedConfig, alerts, groups };
  await saveConfig(updatedConfig, token, '✅ 设置与告警配置保存成功！');

  const oldPassword = document.getElementById('settingOldPassword').value;
  const newUsername = document.getElementById('settingNewUsername').value;
  const newPassword = document.getElementById('settingNewPassword').value;

  if (oldPassword && newPassword) {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newUsername, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`密码修改失败: ${data.error}`);
        return;
      }
      alert('✅ 账号密码已修改，请重新登录！');
      handleLogout();
    } catch (err) {
      alert(`密码修改异常: ${err.message}`);
    }
  }
}

async function saveConfig(configPayload, token, successMsg) {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(configPayload),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(`保存失败: ${data.error || '鉴权失效'}`);
      return;
    }

    alert(successMsg);
    loadConfig();
  } catch (err) {
    alert(`保存异常: ${err.message}`);
  }
}
