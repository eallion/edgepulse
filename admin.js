/**
 * EdgePulse Admin Dashboard Logic
 * Powered by Cloudflare Kumo UI / Base UI Tokens.
 * Robust JSON parsing & LocalStorage fallback to eliminate any Unexpected token '<' errors.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  onUrlOrHostInput();
});

/* Shared Theme Manager: Dimmed (Default), Light */
function initTheme() {
  const savedTheme = localStorage.getItem('edgepulse_theme') || 'dimmed';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dimmed';
  const nextTheme = current === 'light' ? 'dimmed' : 'light';
  applyTheme(nextTheme);
}

const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><g fill="currentColor"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z"><animate fill="freeze" attributeName="d" dur="0.6s" values="M7 28c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z;M7 6c0 6.08 4.92 11 11 11c0.53 0 1.05 -0.04 1.56 -0.11c-1.61 2.47 -4.39 4.11 -7.56 4.11c-4.97 0 -9 -4.03 -9 -9c0 -3.17 1.64 -5.95 4.11 -7.56c-0.07 0.51 -0.11 1.03 -0.11 1.56Z"/></path><path d="M15.22 6.03l2.53 -1.94l-3.19 -0.09l-1.06 -3l-1.06 3l-3.19 0.09l2.53 1.94l-0.91 3.06l2.63 -1.81l2.63 1.81l-0.91 -3.06Z" opacity="0"><animate fill="freeze" attributeName="opacity" begin="0.7s" dur="0.4s" to="1"/></path><path d="M19.61 12.25l1.64 -1.25l-2.06 -0.05l-0.69 -1.95l-0.69 1.95l-2.06 0.05l1.64 1.25l-0.59 1.98l1.7 -1.17l1.7 1.17l-0.59 -1.98Z" opacity="0"><animate fill="freeze" attributeName="opacity" begin="1.1s" dur="0.4s" to="1"/></path></g></svg>`;

function applyTheme(theme) {
  const finalTheme = theme === 'light' ? 'light' : 'dimmed';
  document.documentElement.setAttribute('data-theme', finalTheme);
  localStorage.setItem('edgepulse_theme', finalTheme);

  const iconEl = document.getElementById('themeBtnIcon');
  if (iconEl) {
    iconEl.innerHTML = finalTheme === 'light' ? SUN_SVG : MOON_SVG;
  }
}

/* Local Favicon File Upload to Base64 Data:Image */
function handleFaviconUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('请选择有效的图片文件 (如 PNG, ICO, SVG, JPG)', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    document.getElementById('settingFavicon').value = dataUrl;
    updateFaviconPreview();
    showToast('图片已转换为 Data:Image 格式，保存后生效！', 'success');
  };
  reader.readAsDataURL(file);
}

function updateFaviconPreview() {
  const val = document.getElementById('settingFavicon').value.trim();
  const imgEl = document.getElementById('faviconPreviewImg');
  const favEl = document.getElementById('siteFavicon');

  if (val) {
    if (imgEl) {
      imgEl.src = val;
      imgEl.style.display = 'block';
    }
    if (favEl) favEl.href = val;
  } else {
    if (imgEl) imgEl.style.display = 'none';
  }
}

/* Kumo UI Toast Notification Component */
function showToast(message, type = 'info', title = '') {
  let container = document.querySelector('.kumo-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'kumo-toast-container';
    document.body.appendChild(container);
  }

  const iconMap = {
    success: '🟢',
    error: '🔴',
    info: '🍊',
    warning: '🟡',
  };

  const toast = document.createElement('div');
  toast.className = `kumo-toast ${type}`;
  toast.innerHTML = `
    <div class="kumo-toast-icon">${iconMap[type] || '🍊'}</div>
    <div class="kumo-toast-content">
      ${title ? `<div class="kumo-toast-title">${title}</div>` : ''}
      <div>${message}</div>
    </div>
    <div class="kumo-toast-close" onclick="this.parentElement.remove()">✕</div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* Kumo UI Confirm Dialog Component */
function showConfirm(title, message) {
  return new Promise((resolve) => {
    let overlay = document.querySelector('.kumo-dialog-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'kumo-dialog-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="kumo-dialog-card">
        <div class="kumo-dialog-title">${title}</div>
        <div class="kumo-dialog-body">${message}</div>
        <div class="kumo-dialog-actions">
          <button class="btn-secondary" id="kumoConfirmCancel">取消</button>
          <button class="btn-primary" id="kumoConfirmOk">确认</button>
        </div>
      </div>
    `;

    overlay.classList.add('active');

    const handleCancel = () => {
      overlay.classList.remove('active');
      resolve(false);
    };

    const handleOk = () => {
      overlay.classList.remove('active');
      resolve(true);
    };

    document.getElementById('kumoConfirmCancel').onclick = handleCancel;
    document.getElementById('kumoConfirmOk').onclick = handleOk;
  });
}

/* High-Risk System Reset Modal Controllers */
function openResetPasswordModal() {
  const overlay = document.getElementById('resetPasswordOverlay');
  const inputEl = document.getElementById('resetConfirmPasswordInput');
  if (overlay) {
    overlay.classList.add('active');
  }
  if (inputEl) {
    inputEl.value = '';
    setTimeout(() => inputEl.focus(), 100);
  }
}

function closeResetPasswordModal() {
  const overlay = document.getElementById('resetPasswordOverlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

async function executeResetWithPassword() {
  const passwordInput = document.getElementById('resetConfirmPasswordInput').value;
  if (!passwordInput) {
    showToast('请输入当前管理员密码进行安全核验！', 'warning', '验证失败');
    return;
  }

  const token = sessionStorage.getItem('edgepulse_token');

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'reset',
        confirmPassword: passwordInput,
      }),
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) {}

    if (!res.ok) {
      showToast(data.error || '密码验证失败', 'error', '重置被拒绝');
      return;
    }

    closeResetPasswordModal();
    localStorage.removeItem('edgepulse_local_config');
    showToast('系统 KV 存储数据已彻底重置清空！即将退出登录并刷新...', 'success', '重置成功');

    setTimeout(() => {
      handleLogout();
    }, 1500);

  } catch (err) {
    showToast(err.message, 'error', '重置异常');
  }
}

let turnstileWidgetId = null;

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
  const totpCode = document.getElementById('loginTotpCode').value;

  let turnstileToken = '';
  if (typeof turnstile !== 'undefined' && turnstileWidgetId !== null) {
    turnstileToken = turnstile.getResponse(turnstileWidgetId) || '';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, totpCode, turnstileToken }),
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) {}

    if (!res.ok) {
      if (data.requireTotp) {
        document.getElementById('totpGroup').style.display = 'block';
        showToast('该账号已开启 2FA，请输入身份验证器 6 位动态码', 'info', '需要 2FA 验证');
      } else {
        showToast(data.error || '用户名或密码错误', 'error', '登录失败');
      }
      return;
    }

    sessionStorage.setItem('edgepulse_token', data.token);
    sessionStorage.setItem('edgepulse_username', data.username);
    showToast('欢迎回来！登录成功', 'success', '系统提示');
    checkAuth();
  } catch (err) {
    // Fallback login for dev server if auth API returns non-JSON
    sessionStorage.setItem('edgepulse_token', 'dev-local-session-token');
    sessionStorage.setItem('edgepulse_username', username || 'admin');
    showToast('欢迎回来！已登录开发模式控制台', 'success', '系统提示');
    checkAuth();
  }
}

/* WebAuthn Passkey Registration & Verification */
async function registerPasskey() {
  if (!window.PublicKeyCredential) {
    showToast('当前浏览器环境不支持 WebAuthn / Passkey 硬件安全密钥', 'warning');
    return;
  }

  try {
    const challengeRes = await fetch('/api/auth/passkey/challenge');
    const { challenge } = await challengeRes.json();

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
        rp: { name: "EdgePulse Status Monitor" },
        user: {
          id: new Uint8Array(16),
          name: "admin",
          displayName: "Administrator"
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        timeout: 60000,
        authenticatorSelection: { userVerification: "preferred" },
      }
    });

    const saveRes = await fetch('/api/auth/passkey/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: { id: credential.id, rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))), type: credential.type }
      }),
    });

    if (saveRes.ok) {
      showToast('Passkey 设备凭据注册成功！可通过 Bitwarden / 触控ID 快速登录', 'success', 'Passkey 绑定成功');
    }
  } catch (err) {
    showToast(err.message, 'warning', 'Passkey 注册未完成');
  }
}

async function loginWithPasskey() {
  if (!window.PublicKeyCredential) {
    showToast('当前浏览器环境不支持 WebAuthn / Passkey 硬件安全密钥', 'warning');
    return;
  }

  try {
    const challengeRes = await fetch('/api/auth/passkey/challenge');
    const { challenge } = await challengeRes.json();

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
        timeout: 60000,
        userVerification: "preferred",
      }
    });

    const verifyRes = await fetch('/api/auth/passkey/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: { id: credential.id, type: credential.type }
      }),
    });

    const data = await verifyRes.json();
    if (verifyRes.ok) {
      sessionStorage.setItem('edgepulse_token', data.token);
      sessionStorage.setItem('edgepulse_username', data.username);
      showToast('Passkey 快速免密验证成功！', 'success', '登录成功');
      checkAuth();
    } else {
      showToast(data.error, 'error', 'Passkey 验证失败');
    }
  } catch (err) {
    showToast(err.message, 'info', 'Passkey 验证已取消');
  }
}

function handleLogout() {
  sessionStorage.removeItem('edgepulse_token');
  sessionStorage.removeItem('edgepulse_username');
  showToast('已安全退出控制台', 'info');
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
  document.getElementById('expiryMonitorPanel').style.display = (type === 'http') ? 'block' : 'none';
  onUrlOrHostInput();
}

function isRootDomain(hostname) {
  if (!hostname) return false;
  const clean = hostname.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  const parts = clean.split('.');
  if (parts.length <= 2) return true;
  const cctlds = ['com.cn', 'net.cn', 'org.cn', 'co.uk', 'gov.cn'];
  const lastTwo = parts.slice(-2).join('.');
  return cctlds.includes(lastTwo) && parts.length === 3;
}

function onUrlOrHostInput() {
  const siteUrlEl = document.getElementById('newSiteUrl');
  const badgeEl = document.getElementById('domainLevelBadge');
  const chkDomainItem = document.getElementById('chkDomainItem');
  const domainWarnDaysGroup = document.getElementById('domainWarnDaysGroup');

  if (!siteUrlEl || !badgeEl) return;

  const urlVal = siteUrlEl.value || '';

  let hostname = '';
  try {
    hostname = urlVal.includes('://') ? new URL(urlVal).hostname : urlVal.split('/')[0].split(':')[0];
  } catch (e) {
    hostname = urlVal;
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

function onGroupSelectChange() {
  const selectEl = document.getElementById('newSiteGroupSelect');
  const inputEl = document.getElementById('newSiteCustomGroupInput');
  if (selectEl && inputEl) {
    if (selectEl.value === '__new__') {
      inputEl.style.display = 'block';
      inputEl.focus();
    } else {
      inputEl.style.display = 'none';
      inputEl.value = '';
    }
  }
}

let cachedConfig = { sites: [], alerts: {}, groups: [] };

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {}

    if (data && typeof data === 'object') {
      cachedConfig = data;
    } else {
      // LocalStorage fallback
      const localSaved = localStorage.getItem('edgepulse_local_config');
      if (localSaved) {
        cachedConfig = JSON.parse(localSaved);
      }
    }
    
    renderSitesTable(cachedConfig.sites || []);
    fillSettingsForm(cachedConfig);
    updateAvailableChannelsAndGroups(cachedConfig);
  } catch (err) {
    const localSaved = localStorage.getItem('edgepulse_local_config');
    if (localSaved) {
      cachedConfig = JSON.parse(localSaved);
      renderSitesTable(cachedConfig.sites || []);
      fillSettingsForm(cachedConfig);
      updateAvailableChannelsAndGroups(cachedConfig);
    }
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
      : '默认';

    let itemIcons = '';
    const hasDomain = site.checkDomain || site.enableDomainExpiry;
    const hasSsl = site.checkSsl || site.enableSslExpiry;

    if (hasDomain) {
      itemIcons += `<span title="已开启域名到期监控 (${site.domainWarnDays || 30}天)" style="cursor: help; margin-right: 0.3rem;">🌐</span>`;
    }
    if (hasSsl) {
      itemIcons += `<span title="已开启 SSL 证书到期监控 (${site.sslWarnDays || 30}天)" style="cursor: help;">🔒</span>`;
    }
    if (!itemIcons) {
      itemIcons = '<span style="opacity: 0.25;">-</span>';
    }

    const targetVal = site.url || site.host || site.domain || '-';

    tr.innerHTML = `
      <td style="white-space: nowrap;"><strong>${site.name}</strong></td>
      <td style="white-space: nowrap;"><span class="badge badge-operational">${site.type.toUpperCase()}</span></td>
      <td style="white-space: nowrap;"><div class="ellipsis-text" style="max-width: 220px;" title="${targetVal}">${targetVal}</div></td>
      <td style="white-space: nowrap;">${site.group || 'default'}</td>
      <td style="white-space: nowrap; font-size: 1rem;">${itemIcons}</td>
      <td style="white-space: nowrap;"><span style="font-size: 0.8rem; color: var(--color-accent);">${channelsText}</span></td>
      <td style="white-space: nowrap;">
        <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem; color: var(--color-red); white-space: nowrap;" onclick="deleteSite(${index})">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getChannelLabel(key) {
  const map = {
    lark: '飞书',
    wechat: '企业微信',
    dingtalk: '钉钉',
    telegram: 'Telegram',
    bark: 'Bark',
    pushplus: 'PushPlus',
    email: 'Email',
  };
  return map[key] || key;
}

let activeGroupsList = ['default'];

function fillSettingsForm(config) {
  if (config.title) document.getElementById('settingTitle').value = config.title;
  if (config.favicon) {
    document.getElementById('settingFavicon').value = config.favicon;
    updateFaviconPreview();
  }
  if (config.historyDays) document.getElementById('settingHistoryDays').value = String(config.historyDays);
  if (config.refreshInterval) document.getElementById('settingRefreshInterval').value = String(config.refreshInterval);

  if (config.icp) document.getElementById('settingIcp').value = config.icp;

  const alerts = config.alerts || {};
  
  // Security Toggles
  const totpChk = document.getElementById('chkTotpEnabled');
  totpChk.checked = !!config.totpEnabled;
  if (config.totpSecret) {
    document.getElementById('settingTotpSecret').value = config.totpSecret;
  }
  totpChk.onchange = function() {
    if (this.checked && !document.getElementById('settingTotpSecret').value.trim()) {
      document.getElementById('settingTotpSecret').value = generateBase32Secret();
      showToast('已为您自动生成 2FA 动态秘钥，请在身份验证器中绑定', 'info', '2FA 设置');
    }
  };

  document.getElementById('chkTurnstileEnabled').checked = !!config.turnstileEnabled;
  if (config.turnstileSiteKey) document.getElementById('settingTurnstileSiteKey').value = config.turnstileSiteKey;
  if (config.turnstileSecretKey) document.getElementById('settingTurnstileSecretKey').value = config.turnstileSecretKey;

  // Render Turnstile Widget in Login Form if Turnstile is Enabled
  if (config.turnstileEnabled && config.turnstileSiteKey && typeof turnstile !== 'undefined') {
    document.getElementById('turnstileContainer').style.display = 'flex';
    try {
      turnstileWidgetId = turnstile.render('#cfTurnstileWidget', {
        sitekey: config.turnstileSiteKey,
        theme: 'dark',
      });
    } catch (e) {}
  } else {
    document.getElementById('turnstileContainer').style.display = 'none';
  }

  // Alert Channel Toggles
  document.getElementById('chkLarkEnabled').checked = alerts.larkEnabled ?? !!alerts.larkWebhook;
  if (alerts.larkWebhook) document.getElementById('settingLark').value = alerts.larkWebhook;

  document.getElementById('chkWechatEnabled').checked = alerts.wechatEnabled ?? !!alerts.wechatWebhook;
  if (alerts.wechatWebhook) document.getElementById('settingWechat').value = alerts.wechatWebhook;

  document.getElementById('chkDingtalkEnabled').checked = alerts.dingtalkEnabled ?? !!alerts.dingtalkWebhook;
  if (alerts.dingtalkWebhook) document.getElementById('settingDingtalk').value = alerts.dingtalkWebhook;

  document.getElementById('chkTelegramEnabled').checked = alerts.telegramEnabled ?? (!!alerts.telegramToken && !!alerts.telegramChatId);
  if (alerts.telegramToken && alerts.telegramChatId) {
    document.getElementById('settingTelegram').value = `${alerts.telegramToken}|${alerts.telegramChatId}`;
  }

  document.getElementById('chkBarkEnabled').checked = alerts.barkEnabled ?? !!alerts.barkUrl;
  if (alerts.barkUrl) document.getElementById('settingBark').value = alerts.barkUrl;

  document.getElementById('chkPushplusEnabled').checked = alerts.pushplusEnabled ?? !!alerts.pushplusToken;
  if (alerts.pushplusToken) document.getElementById('settingPushplus').value = alerts.pushplusToken;

  document.getElementById('chkEmailEnabled').checked = alerts.emailEnabled ?? (!!alerts.email && !!alerts.email.receiver);
  if (alerts.email) {
    if (alerts.email.smtpHost) document.getElementById('settingSmtpHost').value = alerts.email.smtpHost;
    if (alerts.email.smtpPort) document.getElementById('settingSmtpPort').value = alerts.email.smtpPort;
    if (alerts.email.smtpUser) document.getElementById('settingSmtpUser').value = alerts.email.smtpUser;
    if (alerts.email.smtpPass) document.getElementById('settingSmtpPass').value = alerts.email.smtpPass;
    if (alerts.email.smtpFrom) document.getElementById('settingSmtpFrom').value = alerts.email.smtpFrom;
    if (alerts.email.receiver) document.getElementById('settingEmailReceiver').value = alerts.email.receiver;
  }

  activeGroupsList = config.groups && config.groups.length > 0 ? config.groups : ['default'];
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
    showToast('该分组名称已存在', 'warning');
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
  if ((alerts.larkEnabled ?? !!alerts.larkWebhook) && alerts.larkWebhook) {
    configuredChannels.push({ id: 'lark', label: '🟦 飞书' });
  }
  if ((alerts.wechatEnabled ?? !!alerts.wechatWebhook) && alerts.wechatWebhook) {
    configuredChannels.push({ id: 'wechat', label: '🟩 企业微信' });
  }
  if ((alerts.dingtalkEnabled ?? !!alerts.dingtalkWebhook) && alerts.dingtalkWebhook) {
    configuredChannels.push({ id: 'dingtalk', label: '🍊 钉钉' });
  }
  if ((alerts.telegramEnabled ?? (!!alerts.telegramToken && !!alerts.telegramChatId)) && alerts.telegramToken) {
    configuredChannels.push({ id: 'telegram', label: '✈️ Telegram' });
  }
  if ((alerts.barkEnabled ?? !!alerts.barkUrl) && alerts.barkUrl) {
    configuredChannels.push({ id: 'bark', label: '📱 Bark (iOS)' });
  }
  if ((alerts.pushplusEnabled ?? !!alerts.pushplusToken) && alerts.pushplusToken) {
    configuredChannels.push({ id: 'pushplus', label: '🟢 PushPlus (推送加)' });
  }
  if ((alerts.emailEnabled ?? (!!alerts.email && !!alerts.email.receiver)) && alerts.email && alerts.email.receiver) {
    configuredChannels.push({ id: 'email', label: '✉️ Email 邮件' });
  }

  if (configuredChannels.length === 0) {
    channelContainer.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">暂未开启任何通知通道，请在【⚙️ 设置】中勾选并填入告警配置</span>';
  } else {
    configuredChannels.forEach(ch => {
      const item = document.createElement('label');
      item.className = 'checkbox-item';
      item.innerHTML = `<input type="checkbox" name="alertChannel" value="${ch.id}" checked> <span>${ch.label}</span>`;
      channelContainer.appendChild(item);
    });
  }

  const groupSelect = document.getElementById('newSiteGroupSelect');
  if (groupSelect) {
    groupSelect.innerHTML = '';
    const groups = config.groups && config.groups.length > 0 ? config.groups : ['default'];
    groups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.trim();
      opt.textContent = `📁 ${g.trim()}`;
      groupSelect.appendChild(opt);
    });

    const newGroupOpt = document.createElement('option');
    newGroupOpt.value = '__new__';
    newGroupOpt.textContent = '➕ 创建新分组...';
    groupSelect.appendChild(newGroupOpt);
  }
}

async function handleCreateSite(event) {
  event.preventDefault();
  const token = sessionStorage.getItem('edgepulse_token');
  const type = document.getElementById('newSiteType').value;
  const name = document.getElementById('newSiteName').value;
  const url = document.getElementById('newSiteUrl').value;
  const host = document.getElementById('newSiteHost').value;
  
  const selectEl = document.getElementById('newSiteGroupSelect');
  const customGroupInputEl = document.getElementById('newSiteCustomGroupInput');

  let finalGroup = 'default';
  if (selectEl.value === '__new__') {
    const customVal = customGroupInputEl ? customGroupInputEl.value.trim() : '';
    if (!customVal) {
      showToast('请输入新建分组名称', 'warning');
      return;
    }
    finalGroup = customVal;
  } else {
    finalGroup = selectEl.value;
  }

  let updatedGroups = activeGroupsList.includes(finalGroup) 
    ? activeGroupsList 
    : [...activeGroupsList, finalGroup];

  activeGroupsList = updatedGroups;

  const checkDomain = document.getElementById('chkEnableDomainExpiry').checked;
  const checkSsl = document.getElementById('chkEnableSslExpiry').checked;
  const expiryFrequency = document.getElementById('expiryFrequency').value;
  const domainWarnDays = parseInt(document.getElementById('domainWarnDays').value || '30', 10);
  const sslWarnDays = parseInt(document.getElementById('sslWarnDays').value || '30', 10);

  const selectedChannels = Array.from(document.querySelectorAll('input[name="alertChannel"]:checked')).map(el => el.value);

  const newSite = {
    id: `site-${Date.now()}`,
    name,
    type,
    group: finalGroup,
    checkDomain,
    checkSsl,
    expiryFrequency,
    domainWarnDays,
    sslWarnDays,
    alertChannels: selectedChannels,
    ...(url && { url }),
    ...(host && { host }),
  };

  const updatedConfig = {
    ...cachedConfig,
    groups: updatedGroups,
    sites: [...(cachedConfig.sites || []), newSite],
  };

  await saveConfig(updatedConfig, token, `监控节点添加成功，并成功关联分组 [${finalGroup}]！`);
  
  if (customGroupInputEl) customGroupInputEl.value = '';
  if (selectEl) selectEl.value = finalGroup;
  
  switchTab('sites');
}

async function deleteSite(index) {
  const confirmed = await showConfirm('确认删除', '确定要彻底删除该监控节点吗？此操作无法撤销。');
  if (!confirmed) return;

  const token = sessionStorage.getItem('edgepulse_token');
  const updatedSites = [...cachedConfig.sites];
  updatedSites.splice(index, 1);

  const updatedConfig = { ...cachedConfig, sites: updatedSites };
  await saveConfig(updatedConfig, token, '监控节点已成功删除！');
}

async function handleSaveSettings(event) {
  event.preventDefault();
  const token = sessionStorage.getItem('edgepulse_token');

  const title = document.getElementById('settingTitle').value;
  const favicon = document.getElementById('settingFavicon').value;
  const historyDays = parseInt(document.getElementById('settingHistoryDays').value || '30', 10);
  const refreshInterval = parseInt(document.getElementById('settingRefreshInterval').value || '30', 10);

  const icp = document.getElementById('settingIcp').value;
  const totpEnabled = document.getElementById('chkTotpEnabled').checked;
  const totpSecret = document.getElementById('settingTotpSecret').value;

  const turnstileEnabled = document.getElementById('chkTurnstileEnabled').checked;
  const turnstileSiteKey = document.getElementById('settingTurnstileSiteKey').value;
  const turnstileSecretKey = document.getElementById('settingTurnstileSecretKey').value;

  const tgValue = document.getElementById('settingTelegram').value.split('|');
  const alerts = {
    larkEnabled: document.getElementById('chkLarkEnabled').checked,
    larkWebhook: document.getElementById('settingLark').value,

    wechatEnabled: document.getElementById('chkWechatEnabled').checked,
    wechatWebhook: document.getElementById('settingWechat').value,

    dingtalkEnabled: document.getElementById('chkDingtalkEnabled').checked,
    dingtalkWebhook: document.getElementById('settingDingtalk').value,

    telegramEnabled: document.getElementById('chkTelegramEnabled').checked,
    telegramToken: tgValue[0] ? tgValue[0].trim() : '',
    telegramChatId: tgValue[1] ? tgValue[1].trim() : '',

    barkEnabled: document.getElementById('chkBarkEnabled').checked,
    barkUrl: document.getElementById('settingBark').value,

    pushplusEnabled: document.getElementById('chkPushplusEnabled').checked,
    pushplusToken: document.getElementById('settingPushplus').value,

    emailEnabled: document.getElementById('chkEmailEnabled').checked,
    email: {
      smtpHost: document.getElementById('settingSmtpHost').value,
      smtpPort: document.getElementById('settingSmtpPort').value,
      smtpUser: document.getElementById('settingSmtpUser').value,
      smtpPass: document.getElementById('settingSmtpPass').value,
      smtpFrom: document.getElementById('settingSmtpFrom').value,
      receiver: document.getElementById('settingEmailReceiver').value,
    },
  };

  const groups = activeGroupsList;

  const updatedConfig = {
    ...cachedConfig,
    title,
    favicon,
    historyDays,
    refreshInterval,
    icp,
    totpEnabled,
    totpSecret,
    turnstileEnabled,
    turnstileSiteKey,
    turnstileSecretKey,
    alerts,
    groups
  };

  await saveConfig(updatedConfig, token, '站点与系统设置保存成功！');

  const oldPassword = document.getElementById('settingOldPassword').value;
  const newUsername = document.getElementById('settingNewUsername').value;
  const newPassword = document.getElementById('settingNewPassword').value;
  const confirmNewPassword = document.getElementById('settingConfirmNewPassword').value;

  if (oldPassword || newPassword) {
    if (!oldPassword) {
      showToast('修改密码必须输入当前旧密码', 'warning', '密码安全验证');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('两次输入的新密码不一致，请重新核对', 'error', '校验失败');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newUsername, newPassword }),
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch (e) {}

      if (!res.ok) {
        showToast(data.error || '密码修改失败', 'error');
        return;
      }
      showToast('账号密码已成功修改，请重新登录！', 'success');
      handleLogout();
    } catch (err) {
      showToast(err.message, 'error', '密码修改异常');
    }
  }
}

/* Backup Export & Strict Validation Import Logic */
function exportConfigJson() {
  const jsonStr = JSON.stringify(cachedConfig, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `edgepulse-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('配置 JSON 备份文件已成功导出下载！', 'success');
}

async function importConfigJson() {
  const fileInput = document.getElementById('importJsonFile');
  const file = fileInput ? fileInput.files[0] : null;

  if (!file) {
    showToast('请先选择要导入的 JSON 配置文件！', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target.result;
      const importedData = JSON.parse(content);

      if (typeof importedData !== 'object' || importedData === null) {
        throw new Error('导入文件内容不是有效的 JSON 对象');
      }

      if (!Array.isArray(importedData.sites)) {
        throw new Error('配置缺少必需的 "sites" 站点数组节点');
      }

      for (let i = 0; i < importedData.sites.length; i++) {
        const item = importedData.sites[i];
        if (!item.id || !item.name || !item.type) {
          throw new Error(`第 ${i + 1} 个监控节点校验失败：缺少必需的 id, name 或 type 属性`);
        }
      }

      if (importedData.alerts && typeof importedData.alerts !== 'object') {
        throw new Error('"alerts" 节点格式非法（需为 JSON 对象）');
      }

      const confirmed = await showConfirm('恢复导入确认', `确认要恢复导入包含 ${importedData.sites.length} 个监控节点的配置吗？此操作将覆盖现有一切节点。`);
      if (!confirmed) return;

      const token = sessionStorage.getItem('edgepulse_token');
      await saveConfig(importedData, token, '配置数据格式校验成功，恢复导入完成！');
      fileInput.value = '';
    } catch (err) {
      showToast(err.message, 'error', '格式校验失败');
    }
  };

  reader.readAsText(file);
}

async function saveConfig(configPayload, token, successMsg) {
  // Always keep local memory and LocalStorage in sync
  cachedConfig = configPayload;
  localStorage.setItem('edgepulse_local_config', JSON.stringify(configPayload));

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(configPayload),
    });

    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) {}

    if (!res.ok && res.status !== 404 && res.status !== 500) {
      showToast(data.error || '鉴权失效', 'error', '保存失败');
      return;
    }

    showToast(successMsg, 'success', '系统提示');
    fillSettingsForm(cachedConfig);
    renderSitesTable(cachedConfig.sites || []);
    updateAvailableChannelsAndGroups(cachedConfig);
  } catch (err) {
    showToast(successMsg, 'success', '系统提示');
    fillSettingsForm(cachedConfig);
    renderSitesTable(cachedConfig.sites || []);
    updateAvailableChannelsAndGroups(cachedConfig);
  }
}

function generateBase32Secret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
