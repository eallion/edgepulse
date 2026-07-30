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
    if (!challengeRes.ok) {
      const errData = await challengeRes.json().catch(() => ({}));
      showToast(errData.error || '系统尚未绑定任何 Passkey 密钥，请先使用密码登录后在设置中绑定', 'warning', 'Passkey 提示');
      return;
    }

    const { challenge } = await challengeRes.json();
    if (!challenge) {
      showToast('系统尚未绑定任何 Passkey 密钥，请先使用密码登录', 'warning', 'Passkey 提示');
      return;
    }

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
        timeout: 60000,
        userVerification: "preferred",
      }
    });

    if (!credential) {
      showToast('未检测到有效的 Passkey 凭据', 'warning');
      return;
    }

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
      showToast('Passkey 验证成功，正在登录...', 'success', '登录成功');
      checkAuth();
    } else {
      showToast(data.error || 'Passkey 验证失败', 'error', '验证失败');
    }
  } catch (err) {
    if (err.name === 'NotAllowedError' || (err.message && err.message.includes('cancel'))) {
      showToast('Passkey 验证已取消', 'info');
    } else {
      showToast(err.message || '系统尚未绑定任何 Passkey 密钥，请先使用密码登录', 'warning', 'Passkey 提示');
    }
  }
}

function handleLogout() {
  sessionStorage.removeItem('edgepulse_token');
  sessionStorage.removeItem('edgepulse_username');
  showToast('已安全退出控制台', 'info');
  checkAuth();
}

function switchTab(tabName) {
  const tabs = ['sites', 'addSite', 'pages', 'settings'];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`tab-${t}`);
    if (tabEl) tabEl.style.display = t === tabName ? 'block' : 'none';
  });

  const tabItems = document.querySelectorAll('.tab-item');
  tabItems.forEach((el, idx) => {
    if (el) el.classList.toggle('active', tabs[idx] === tabName);
  });

  if (tabName === 'sites') {
    renderSitesTable(cachedConfig.sites || []);
  } else if (tabName === 'pages') {
    renderPagesTab();
  }
}

/* Multi-Domain Custom Status Pages Controllers */
function renderPagesTab() {
  renderPageGroupSitesBoxes();
  renderPagesTable();
}

function filterPageSitesByType(typeFilter, btnEl) {
  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    btn.style.background = 'transparent';
    btn.style.color = 'var(--text-secondary)';
    btn.classList.remove('active');
  });
  if (btnEl) {
    btnEl.style.background = 'var(--color-accent)';
    btnEl.style.color = 'white';
    btnEl.classList.add('active');
  }

  const items = document.querySelectorAll('.page-site-cb-item');
  items.forEach(item => {
    const itemType = item.getAttribute('data-type');
    if (typeFilter === 'all' || itemType === typeFilter) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function renderPageGroupSitesBoxes(currentGroupSites = {}) {
  const container = document.getElementById('pageGroupSitesContainer');
  if (!container) return;

  const groups = cachedConfig.groups && cachedConfig.groups.length > 0 ? cachedConfig.groups : ['默认分组'];
  const sites = cachedConfig.sites || [];

  if (sites.length === 0) {
    container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">暂无可用监控节点，请先在【📍 监控节点】中创建节点</span>';
    return;
  }

  const filterBarHtml = `
    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.85rem; flex-wrap: wrap; background: var(--bg-card-secondary); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-card);">
      <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-right: 0.3rem;">🔍 按节点类型筛选:</span>
      <button type="button" class="type-filter-btn active" data-type="all" onclick="filterPageSitesByType('all', this)" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--color-accent); color: white; cursor: pointer;">全部 (${sites.length})</button>
      <button type="button" class="type-filter-btn" data-type="http" onclick="filterPageSitesByType('http', this)" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer;">HTTP(S)</button>
      <button type="button" class="type-filter-btn" data-type="icmp" onclick="filterPageSitesByType('icmp', this)" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer;">ICMP</button>
      <button type="button" class="type-filter-btn" data-type="tcp" onclick="filterPageSitesByType('tcp', this)" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer;">TCP</button>
      <button type="button" class="type-filter-btn" data-type="dns" onclick="filterPageSitesByType('dns', this)" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer;">DNS</button>
      <button type="button" class="type-filter-btn" data-type="push" onclick="filterPageSitesByType('push', this)" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); cursor: pointer;">PUSH</button>
    </div>
  `;

  const cardsHtml = groups.map(g => {
    const selectedSitesForGroup = currentGroupSites[g] || [];

    const siteCheckboxesHtml = sites.map(s => {
      const isChecked = selectedSitesForGroup.includes(s.id) ? 'checked' : '';
      return `
        <label class="page-site-cb-item" data-type="${s.type.toLowerCase()}" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer; color: var(--text-primary);">
          <input type="checkbox" class="page-site-cb" data-group="${g}" value="${s.id}" ${isChecked}>
          <span>${s.name} <small style="color: var(--text-muted);">(${s.type.toUpperCase()})</small></span>
        </label>
      `;
    }).join('');

    return `
      <div class="group-assignment-card" style="background: var(--bg-card-secondary); border: 1px solid var(--border-card); border-radius: 8px; padding: 0.85rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.4rem;">
          <span style="font-weight: 600; color: var(--color-accent); font-size: 0.9rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>${g}</span>
          <button type="button" class="btn-secondary" style="padding: 0.15rem 0.4rem; font-size: 0.75rem; color: var(--color-red);" onclick="deletePageGroupSync('${g}')">删除分组</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
          ${siteCheckboxesHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = filterBarHtml + cardsHtml;
}

async function addPageGroupSync() {
  const input = document.getElementById('pageNewGroupInput');
  const val = input ? input.value.trim() : '';
  if (!val) {
    showToast('请输入新分组名称', 'warning', '添加分组');
    return;
  }
  if (!cachedConfig.groups) cachedConfig.groups = ['默认分组'];
  if (cachedConfig.groups.includes(val)) {
    showToast('该分组名称已存在', 'warning', '添加分组');
    return;
  }
  cachedConfig.groups.push(val);
  input.value = '';

  const token = localStorage.getItem('edgepulse_admin_token') || 'dev_authenticated_token';
  await saveConfig(cachedConfig, token, '新分组添加成功，已同步至设置与监控页！');
  renderGroupTags(cachedConfig.groups);
  renderPageGroupSitesBoxes(getCurrentPageFormGroupSites());
}

async function deletePageGroupSync(groupName) {
  showKumoConfirm({
    title: '确认删除分组',
    message: `是否确定删除分组【${groupName}】？该操作将从系统设置与所有监控页中同步移除此分组。`,
    confirmText: '确认删除',
    onConfirm: async () => {
      if (cachedConfig.groups) {
        cachedConfig.groups = cachedConfig.groups.filter(g => g !== groupName);
        if (cachedConfig.groups.length === 0) cachedConfig.groups = ['默认分组'];
        const token = localStorage.getItem('edgepulse_admin_token') || 'dev_authenticated_token';
        await saveConfig(cachedConfig, token, '分组已成功删除！');
        renderGroupTags(cachedConfig.groups);
        renderPageGroupSitesBoxes(getCurrentPageFormGroupSites());
      }
    }
  });
}

function getCurrentPageFormGroupSites() {
  const currentMap = {};
  (cachedConfig.groups || ['默认分组']).forEach(g => {
    const checkedSiteIds = Array.from(document.querySelectorAll(`.page-site-cb[data-group="${g}"]:checked`)).map(cb => cb.value);
    if (checkedSiteIds.length > 0) {
      currentMap[g] = checkedSiteIds;
    }
  });
  return currentMap;
}

function getAllPagesWithDefault() {
  const userPages = cachedConfig.pages || [];
  const hasCustomDefault = userPages.some(p => p.id === 'default' || p.isDefault);

  if (hasCustomDefault) {
    return userPages;
  }

  const currentHost = window.location.host || window.location.hostname || 'localhost';
  const defaultPage = {
    id: 'default',
    isDefault: true,
    domain: `${currentHost} (当前主站)`,
    name: '全局默认 Status 页',
    title: cachedConfig.title || 'EdgePulse Status',
    announcement: cachedConfig.announcement || '',
    siteIds: null,
    groupSites: null
  };

  return [defaultPage, ...userPages];
}

function renderPagesTable() {
  const tbody = document.getElementById('pagesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const displayPages = getAllPagesWithDefault();
  const allSites = cachedConfig.sites || [];

  displayPages.forEach((page) => {
    const tr = document.createElement('tr');

    let groupsSummary = '<span style="color: var(--text-muted);">全部分组</span>';
    if (page.groupSites && Object.keys(page.groupSites).length > 0) {
      groupsSummary = Object.entries(page.groupSites).map(([g, sIds]) => 
        `<span class="tag" style="background: rgba(246, 130, 31, 0.12); color: var(--color-accent); border: 1px solid var(--border-color); font-size: 0.75rem; padding: 0.1rem 0.4rem; border-radius: 4px; margin-right: 0.25rem; display: inline-block;">📂 ${g} (${sIds.length}项)</span>`
      ).join('');
    }

    let sitesSummary = '<span style="color: var(--text-muted);">包含全部监控项</span>';
    if (page.siteIds && page.siteIds.length > 0) {
      const matchedNames = page.siteIds.map(id => {
        const site = allSites.find(s => s.id === id);
        return site ? site.name : id;
      });
      sitesSummary = `<span style="color: var(--color-accent); font-weight: 500;">${matchedNames.join(', ')}</span> <small style="color: var(--text-muted);">(${page.siteIds.length} 项)</small>`;
    }

    const domainDisplay = page.isDefault 
      ? `<strong>${page.domain || (window.location.host || window.location.hostname)}</strong> <span class="badge" style="background: rgba(34, 197, 94, 0.15); color: var(--color-green); font-size: 0.7rem; margin-left: 0.35rem; font-weight: normal;">系统默认</span>`
      : `<strong>${page.domain || '-'}</strong>`;

    const actionButtons = page.isDefault
      ? `<button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem; margin-right: 0.3rem;" onclick="editCustomPageById('${page.id}')">编辑</button><span style="color: var(--text-muted); font-size: 0.8rem;" title="默认主页不可删除">默认</span>`
      : `<button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem; margin-right: 0.3rem;" onclick="editCustomPageById('${page.id}')">编辑</button><button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem; color: var(--color-red);" onclick="deleteCustomPageById('${page.id}')">删除</button>`;

    tr.innerHTML = `
      <td style="white-space: nowrap;">${domainDisplay}</td>
      <td style="white-space: nowrap;">${page.name || '-'}</td>
      <td style="white-space: nowrap;">${groupsSummary}</td>
      <td style="white-space: nowrap;"><div class="ellipsis-text" style="max-width: 220px;" title="${page.siteIds ? page.siteIds.join(',') : ''}">${sitesSummary}</div></td>
      <td style="white-space: nowrap;">${page.title || '<span style="color: var(--text-muted);">(继承全局)</span>'}</td>
      <td style="white-space: nowrap;">${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function handleSaveCustomPage() {
  const editingId = document.getElementById('pageEditingId').value;
  const isEditingDefault = editingId === 'default';

  let domain = document.getElementById('pageDomainInput').value.trim();
  if (isEditingDefault) {
    domain = window.location.host || window.location.hostname || 'default';
  }

  const name = document.getElementById('pageNameInput').value.trim();
  const title = document.getElementById('pageTitleConfigInput').value.trim();
  const announcement = document.getElementById('pageAnnouncementInput').value.trim();

  if (!domain && !isEditingDefault) {
    showToast('请输入 Status 域名', 'error', '表单验证失败');
    return;
  }

  const groupSitesMap = {};
  const allSelectedSiteIds = new Set();

  (cachedConfig.groups || ['默认分组']).forEach(g => {
    const checkedSiteIds = Array.from(document.querySelectorAll(`.page-site-cb[data-group="${g}"]:checked`)).map(cb => cb.value);
    if (checkedSiteIds.length > 0) {
      groupSitesMap[g] = checkedSiteIds;
      checkedSiteIds.forEach(id => allSelectedSiteIds.add(id));
    }
  });

  if (!cachedConfig.pages) cachedConfig.pages = [];

  const selectedSiteList = Array.from(allSelectedSiteIds);
  const totalSitesCount = (cachedConfig.sites || []).length;
  const isAllSitesSelected = totalSitesCount === 0 || selectedSiteList.length >= totalSitesCount;
  const cleanDomain = domain.replace(/\s*\([^)]*\)/g, '').trim();

  const pageData = {
    domain: cleanDomain,
    name: name || (isEditingDefault ? '全局默认 Status 页' : cleanDomain),
    title,
    announcement,
    groupSites: groupSitesMap,
    siteIds: isAllSitesSelected ? null : selectedSiteList,
  };

  if (editingId) {
    const index = cachedConfig.pages.findIndex(p => p.id === editingId);
    if (index !== -1) {
      cachedConfig.pages[index] = {
        ...cachedConfig.pages[index],
        ...pageData
      };
    } else {
      cachedConfig.pages.push({
        id: editingId,
        isDefault: isEditingDefault,
        ...pageData
      });
    }
  } else {
    cachedConfig.pages.push({
      id: 'page-' + Date.now(),
      ...pageData
    });
  }

  const token = sessionStorage.getItem('edgepulse_token') || 'dev_authenticated_token';
  await saveConfig(cachedConfig, token, 'Status 监控页保存成功！');
  resetPageForm();
  renderPagesTab();
}

function editCustomPageById(id) {
  const displayPages = getAllPagesWithDefault();
  const page = displayPages.find(p => p.id === id);
  if (!page) return;

  const isDefault = page.isDefault || page.id === 'default';

  document.getElementById('pageEditorTitle').innerHTML = isDefault
    ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>✏️ 编辑默认 Status 监控页 (当前主站)'
    : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>编辑 Status 监控页';

  document.getElementById('pageEditingId').value = page.id;
  const domainInput = document.getElementById('pageDomainInput');
  if (domainInput) {
    domainInput.value = isDefault ? (window.location.host || window.location.hostname || '当前主站域名') : (page.domain || '');
    domainInput.disabled = isDefault;
  }

  document.getElementById('pageNameInput').value = page.name || '';
  document.getElementById('pageTitleConfigInput').value = page.title || '';
  document.getElementById('pageAnnouncementInput').value = page.announcement || '';
  document.getElementById('cancelEditPageBtn').style.display = 'inline-block';

  renderPageGroupSitesBoxes(page.groupSites || {});
}

function deleteCustomPageById(id) {
  if (id === 'default') {
    showToast('默认 Status 监控页不可删除', 'warning');
    return;
  }

  showConfirm('确认删除 Status 监控页', '删除后该自定义域名将自动使用全局默认 Status 页，是否确定删除？').then(async (confirmed) => {
    if (confirmed) {
      if (cachedConfig.pages) {
        cachedConfig.pages = cachedConfig.pages.filter(p => p.id !== id);
        const token = sessionStorage.getItem('edgepulse_token') || 'dev_authenticated_token';
        await saveConfig(cachedConfig, token, 'Status 监控页已成功删除！');
        resetPageForm();
        renderPagesTab();
      }
    }
  });
}

function resetPageForm() {
  document.getElementById('pageEditorTitle').innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.3rem;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加 Status 监控页';
  document.getElementById('pageEditingId').value = '';
  const domainInput = document.getElementById('pageDomainInput');
  if (domainInput) {
    domainInput.value = '';
    domainInput.disabled = false;
  }
  document.getElementById('pageNameInput').value = '';
  document.getElementById('pageTitleConfigInput').value = '';
  document.getElementById('pageAnnouncementInput').value = '';
  document.getElementById('cancelEditPageBtn').style.display = 'none';

  renderPageGroupSitesBoxes({});
}

function toggleAdminFormFields() {
  const type = document.getElementById('newSiteType').value;
  document.getElementById('adminUrlGroup').style.display = (type === 'http') ? 'block' : 'none';
  document.getElementById('adminHostGroup').style.display = (type === 'icmp' || type === 'tcp' || type === 'dns') ? 'block' : 'none';
  document.getElementById('expiryMonitorPanel').style.display = (type === 'http') ? 'block' : 'none';

  const hostLabel = document.getElementById('adminHostLabel');
  const hostInput = document.getElementById('newSiteHost');
  if (hostLabel && hostInput) {
    if (type === 'dns') {
      hostLabel.textContent = '查询的目标域名 (Domain)';
      hostInput.placeholder = '例如: example.com';
    } else {
      hostLabel.textContent = '目标 IP / Host';
      hostInput.placeholder = '1.2.3.4 或 db.example.com';
    }
  }

  const dnsGroup = document.getElementById('adminDnsGroup');
  if (dnsGroup) {
    dnsGroup.style.display = (type === 'dns') ? 'block' : 'none';
  }

  const pushGroup = document.getElementById('adminPushGroup');
  if (pushGroup) {
    if (type === 'push') {
      pushGroup.style.display = 'block';
      generateOrRefreshNewSitePushUrl();
    } else {
      pushGroup.style.display = 'none';
    }
  }

  onUrlOrHostInput();
}

function generateLongPushToken() {
  let hex = '';
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    hex = Date.now().toString(36) + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }
  return 'pulse_sec_' + hex;
}

function generateOrRefreshNewSitePushUrl(forceRegen = false) {
  const input = document.getElementById('newSitePushUrl');
  const codeHint = document.getElementById('pushUrlCodeHint');
  const cronHint = document.getElementById('pushUrlCronHint');
  if (!input) return;

  if (!input.value || forceRegen) {
    const token = generateLongPushToken();
    const pushUrl = `${window.location.origin}/api/push?token=${token}`;
    input.value = pushUrl;
    input.setAttribute('data-token', token);
    if (forceRegen) {
      showToast('Push 专属 Token 已重新生成！', 'success', 'Token 刷新成功');
    }
  }
  if (codeHint) codeHint.textContent = input.value;
  if (cronHint) cronHint.textContent = input.value;
}

function copyNewSitePushUrl() {
  const input = document.getElementById('newSitePushUrl');
  if (!input || !input.value) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('Push 打卡链接已成功复制到剪贴板', 'success', '复制成功');
    }).catch(() => {
      showToast('复制失败，请手动选择复制', 'error', '复制失败');
    });
  } else {
    showToast('Push 打卡链接：' + input.value, 'info', '打卡链接');
  }
}

function autoCompleteHttps(inputEl) {
  if (!inputEl) return;
  let val = inputEl.value ? inputEl.value.trim() : '';
  if (val && !/^https?:\/\//i.test(val)) {
    inputEl.value = 'https://' + val;
    onUrlOrHostInput();
  }
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
  const chkDomainItem = document.getElementById('chkDomainItem');
  const domainWarnDaysGroup = document.getElementById('domainWarnDaysGroup');
  const chkEnableDomain = document.getElementById('chkEnableDomainExpiry');

  if (!siteUrlEl) return;

  const urlVal = siteUrlEl.value || '';

  let hostname = '';
  try {
    hostname = urlVal.includes('://') ? new URL(urlVal).hostname : urlVal.split('/')[0].split(':')[0];
  } catch (e) {
    hostname = urlVal;
  }

  const isApex = isRootDomain(hostname);

  if (isApex && hostname) {
    if (chkDomainItem) chkDomainItem.style.display = 'flex';
    if (domainWarnDaysGroup) domainWarnDaysGroup.style.display = 'block';
  } else {
    if (chkDomainItem) chkDomainItem.style.display = 'none';
    if (domainWarnDaysGroup) domainWarnDaysGroup.style.display = 'none';
    if (chkEnableDomain) chkEnableDomain.checked = false;
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
      }
      
      renderSitesTable(cachedConfig.sites || []);
      fillSettingsForm(cachedConfig);
      updateAvailableChannelsAndGroups(cachedConfig);
    } catch (err) {
      renderSitesTable(cachedConfig.sites || []);
      fillSettingsForm(cachedConfig);
      updateAvailableChannelsAndGroups(cachedConfig);
    }
  }

function renderSitesTable(sites) {
  const tbody = document.getElementById('sitesTableBody');
  tbody.innerHTML = '';

  if (!sites || sites.length === 0) {
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
      itemIcons += `<span title="已开启域名到期监控 (${site.domainWarnDays || 30}天)" style="cursor: pointer; margin-right: 0.35rem; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2m6.918 6h-3.215a49 49 0 0 0-.565-3.357A8.05 8.05 0 0 1 18.918 8m-5.904-3.928c.068.352.387 2.038.645 3.928h-3.318c.258-1.89.577-3.576.645-3.928C11.319 4.029 11.656 4 12 4s.681.029 1.014.072M14 12c0 .598-.043 1.286-.109 2h-3.782c-.066-.714-.109-1.402-.109-2s.043-1.286.109-2h3.782c.066.714.109 1.402.109 2M8.862 4.643A49 49 0 0 0 8.297 8H5.082a8.05 8.05 0 0 1 3.78-3.357M4.263 10h3.821C8.033 10.668 8 11.344 8 12s.033 1.332.085 2H4.263C4.097 13.359 4 12.692 4 12s.098-1.359.263-2m.819 6h3.215c.188 1.424.42 2.65.565 3.357A8.05 8.05 0 0 1 5.082 16m5.904 3.928A77 77 0 0 1 10.341 16h3.318a78 78 0 0 1-.645 3.928c-.333.043-.67.072-1.014.072s-.681-.029-1.014-.072m4.152-.571c.145-.707.377-1.933.565-3.357h3.215a8.05 8.05 0 0 1-3.78 3.357M19.737 14h-3.821c.051-.668.084-1.344.084-2s-.033-1.332-.085-2h3.821c.166.641.264 1.308.264 2s-.097 1.359-.263 2"/></svg></span>`;
    }
    if (hasSsl) {
      itemIcons += `<span title="已开启 SSL 证书到期监控 (${site.sslWarnDays || 30}天)" style="cursor: pointer; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 1792 1792"><path d="M0 0h1792v1792H0z" fill="none"/><path fill="currentColor" d="M896 64q-169 0-323 66T307.5 307.5T130 573T64 896t66 323t177.5 265.5T573 1662t323 66t323-66t265.5-177.5T1662 1219t66-323t-66-323t-177.5-265.5T1219 130T896 64m0-64q182 0 348 71t286 191t191 286t71 348t-71 348t-191 286t-286 191t-348 71t-348-71t-286-191t-191-286T0 896t71-348t191-286T548 71T896 0M496 832q16 0 16 16v480q0 16-16 16h-32q-16 0-16-16V848q0-16 16-16zm400 64q53 0 90.5 37.5t37.5 90.5q0 35-17.5 64t-46.5 46v114q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-114q-29-17-46.5-46t-17.5-64q0-53 37.5-90.5T896 896m0-768q209 0 385.5 103T1561 510.5T1664 896t-103 385.5t-279.5 279.5T896 1664t-385.5-103T231 1281.5T128 896t103-385.5T510.5 231T896 128M544 608v96q0 14 9 23t23 9h64q14 0 23-9t9-23v-96q0-93 65.5-158.5T896 384t158.5 65.5T1120 608v96q0 14 9 23t23 9h64q14 0 23-9t9-23v-96q0-146-103-249T896 256T647 359T544 608m864 736V832q0-26-19-45t-45-19H448q-26 0-45 19t-19 45v512q0 26 19 45t45 19h896q26 0 45-19t19-45"/></svg></span>`;
    }
    if (!itemIcons) {
      itemIcons = '<span style="opacity: 0.25;">-</span>';
    }

    const targetVal = site.url || site.host || site.domain || '-';
    const typeBadgeText = site.type === 'dns' ? `DNS (${site.dnsType || 'A'})` : site.type.toUpperCase();

    tr.innerHTML = `
      <td style="white-space: nowrap;"><strong>${site.name}</strong>${mockBadge}</td>
      <td style="white-space: nowrap;"><span class="badge badge-operational">${typeBadgeText}</span></td>
      <td style="white-space: nowrap;"><div class="ellipsis-text" style="max-width: 220px;" title="${targetVal}">${targetVal}</div></td>
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

function safeSetValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

function safeSetChecked(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = !!val;
}

function fillSettingsForm(config) {
  if (!config) return;

  if (config.title) safeSetValue('settingTitle', config.title);
  if (config.favicon) {
    safeSetValue('settingFavicon', config.favicon);
    updateFaviconPreview();
  }
  if (config.historyDays) safeSetValue('settingHistoryDays', String(config.historyDays));
  if (config.refreshInterval) safeSetValue('settingRefreshInterval', String(config.refreshInterval));

  if (config.icp) safeSetValue('settingIcp', config.icp);

  const alerts = config.alerts || {};
  
  // Security Toggles
  const totpChk = document.getElementById('chkTotpEnabled');
  if (totpChk) {
    totpChk.checked = !!config.totpEnabled;
    totpChk.onchange = function() {
      if (this.checked && !document.getElementById('settingTotpSecret').value.trim()) {
        safeSetValue('settingTotpSecret', generateBase32Secret());
        showToast('已为您自动生成 2FA 动态秘钥，请在身份验证器中绑定', 'info', '2FA 设置');
      }
      updateTotpQrCode();
    };
  }
  if (config.totpSecret) safeSetValue('settingTotpSecret', config.totpSecret);
  updateTotpQrCode();

  safeSetChecked('chkTurnstileEnabled', config.turnstileEnabled);
  if (config.turnstileSiteKey) safeSetValue('settingTurnstileSiteKey', config.turnstileSiteKey);
  if (config.turnstileSecretKey) safeSetValue('settingTurnstileSecretKey', config.turnstileSecretKey);

  // Render Turnstile Widget in Login Form if Turnstile is Enabled
  const turnstileBox = document.getElementById('turnstileContainer');
  if (turnstileBox) {
    if (config.turnstileEnabled && config.turnstileSiteKey && typeof turnstile !== 'undefined') {
      turnstileBox.style.display = 'flex';
      try {
        turnstileWidgetId = turnstile.render('#cfTurnstileWidget', {
          sitekey: config.turnstileSiteKey,
          theme: 'dark',
        });
      } catch (e) {}
    } else {
      turnstileBox.style.display = 'none';
    }
  }

  // Alert Channel Toggles
  safeSetChecked('chkLarkEnabled', alerts.larkEnabled ?? !!alerts.larkWebhook);
  if (alerts.larkWebhook) safeSetValue('settingLark', alerts.larkWebhook);

  safeSetChecked('chkWechatEnabled', alerts.wechatEnabled ?? !!alerts.wechatWebhook);
  if (alerts.wechatWebhook) safeSetValue('settingWechat', alerts.wechatWebhook);

  safeSetChecked('chkDingtalkEnabled', alerts.dingtalkEnabled ?? !!alerts.dingtalkWebhook);
  if (alerts.dingtalkWebhook) safeSetValue('settingDingtalk', alerts.dingtalkWebhook);

  safeSetChecked('chkTelegramEnabled', alerts.telegramEnabled ?? (!!alerts.telegramToken && !!alerts.telegramChatId));
  if (alerts.telegramToken && alerts.telegramChatId) {
    safeSetValue('settingTelegram', `${alerts.telegramToken}|${alerts.telegramChatId}`);
  }

  safeSetChecked('chkBarkEnabled', alerts.barkEnabled ?? !!alerts.barkUrl);
  if (alerts.barkUrl) safeSetValue('settingBark', alerts.barkUrl);

  safeSetChecked('chkPushplusEnabled', alerts.pushplusEnabled ?? !!alerts.pushplusToken);
  if (alerts.pushplusToken) safeSetValue('settingPushplus', alerts.pushplusToken);

  safeSetChecked('chkEmailEnabled', alerts.emailEnabled ?? (!!alerts.email && !!alerts.email.receiver));
  if (alerts.email) {
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
      <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -0.15em; margin-right: 0.2rem;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>${group}</span>
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
  if (!channelContainer) return;
  channelContainer.innerHTML = '';

  const configuredChannels = [];
  if ((alerts.larkEnabled ?? !!alerts.larkWebhook) && alerts.larkWebhook) {
    configuredChannels.push({ id: 'lark', label: '飞书' });
  }
  if ((alerts.wechatEnabled ?? !!alerts.wechatWebhook) && alerts.wechatWebhook) {
    configuredChannels.push({ id: 'wechat', label: '企业微信' });
  }
  if ((alerts.dingtalkEnabled ?? !!alerts.dingtalkWebhook) && alerts.dingtalkWebhook) {
    configuredChannels.push({ id: 'dingtalk', label: '钉钉' });
  }
  if ((alerts.telegramEnabled ?? (!!alerts.telegramToken && !!alerts.telegramChatId)) && alerts.telegramToken) {
    configuredChannels.push({ id: 'telegram', label: 'Telegram' });
  }
  if ((alerts.barkEnabled ?? !!alerts.barkUrl) && alerts.barkUrl) {
    configuredChannels.push({ id: 'bark', label: 'Bark' });
  }
  if ((alerts.pushplusEnabled ?? !!alerts.pushplusToken) && alerts.pushplusToken) {
    configuredChannels.push({ id: 'pushplus', label: 'PushPlus' });
  }
  if ((alerts.emailEnabled ?? (!!alerts.email && !!alerts.email.receiver)) && alerts.email && alerts.email.receiver) {
    configuredChannels.push({ id: 'email', label: 'Email 邮件' });
  }

  if (configuredChannels.length === 0) {
    channelContainer.innerHTML = '<span style="font-size: 0.85rem; color: var(--text-muted);">暂未开启任何通知通道，请在【设置】中勾选并填入告警配置</span>';
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
      opt.textContent = g.trim();
      groupSelect.appendChild(opt);
    });

    const newGroupOpt = document.createElement('option');
    newGroupOpt.value = '__new__';
    newGroupOpt.textContent = '创建新分组...';
    groupSelect.appendChild(newGroupOpt);
  }
}

async function handleCreateSite(event) {
  event.preventDefault();
  const token = sessionStorage.getItem('edgepulse_token');
  const type = document.getElementById('newSiteType').value;
  const name = document.getElementById('newSiteName').value;
  let url = document.getElementById('newSiteUrl').value.trim();
  if (type === 'http' && url && !/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  const host = document.getElementById('newSiteHost').value.trim();
  
  let pushUrlVal = '';
  let pushTokenVal = '';
  if (type === 'push') {
    const pushInput = document.getElementById('newSitePushUrl');
    pushTokenVal = pushInput ? (pushInput.getAttribute('data-token') || 'pulse_' + Date.now()) : ('pulse_' + Date.now());
    pushUrlVal = pushInput && pushInput.value ? pushInput.value : `${window.location.origin}/api/push?token=${pushTokenVal}`;
  }

  let dnsType = 'A';
  let dnsExpected = '';
  if (type === 'dns') {
    dnsType = document.getElementById('newSiteDnsType')?.value || 'A';
    dnsExpected = document.getElementById('newSiteDnsExpected')?.value.trim() || '';
  }

  const port = document.getElementById('newSitePort')?.value.trim() || '';
  let finalHost = host;
  if (type === 'tcp' && port && host && !host.includes(':')) {
    finalHost = `${host}:${port}`;
  }

  const checkDomain = document.getElementById('chkEnableDomainExpiry').checked;
  const checkSsl = document.getElementById('chkEnableSslExpiry').checked;
  const expiryFrequency = document.getElementById('expiryFrequency').value;
  const domainWarnDays = parseInt(document.getElementById('domainWarnDays').value || '30', 10);
  const sslWarnDays = parseInt(document.getElementById('sslWarnDays').value || '30', 10);

  const selectedChannels = Array.from(document.querySelectorAll('input[name="alertChannel"]:checked')).map(el => el.value);

  let selectedGroup = 'default';
  const groupSelectEl = document.getElementById('newSiteGroupSelect');
  const customGroupInputEl = document.getElementById('newSiteCustomGroupInput');

  if (groupSelectEl) {
    if (groupSelectEl.value === '__new__' && customGroupInputEl && customGroupInputEl.value.trim()) {
      selectedGroup = customGroupInputEl.value.trim();
    } else if (groupSelectEl.value && groupSelectEl.value !== '__new__') {
      selectedGroup = groupSelectEl.value.trim();
    }
  }

  const newSite = {
    id: `site-${Date.now()}`,
    name,
    type,
    group: selectedGroup,
    checkDomain,
    checkSsl,
    expiryFrequency,
    domainWarnDays,
    sslWarnDays,
    alertChannels: selectedChannels,
    ...(type === 'dns' && { dnsType, dnsExpected }),
    ...(type === 'tcp' && { port }),
    ...(type === 'push' ? { url: pushUrlVal, pushToken: pushTokenVal } : { ...(url && { url }), ...(finalHost && { host: finalHost }) }),
  };

  // Automatically attach newSite.id to existing pages if siteIds array is configured
  if (cachedConfig.pages && Array.isArray(cachedConfig.pages)) {
    cachedConfig.pages.forEach(page => {
      if (page.siteIds && Array.isArray(page.siteIds)) {
        if (!page.siteIds.includes(newSite.id)) {
          page.siteIds.push(newSite.id);
        }
      }
      if (!page.groupSites) page.groupSites = {};
      if (!page.groupSites[selectedGroup]) page.groupSites[selectedGroup] = [];
      if (!page.groupSites[selectedGroup].includes(newSite.id)) {
        page.groupSites[selectedGroup].push(newSite.id);
      }
    });
  }

  const updatedConfig = {
    ...cachedConfig,
    sites: [...(cachedConfig.sites || []), newSite],
  };

  await saveConfig(updatedConfig, token, `监控节点【${name}】添加成功！`);

  const pushInput = document.getElementById('newSitePushUrl');
  if (pushInput) {
    pushInput.value = '';
    pushInput.removeAttribute('data-token');
  }
  
  switchTab('sites');
}

async function deleteSite(index) {
  const site = (cachedConfig.sites || [])[index];
  if (!site) return;

  const confirmed = await showConfirm('确认删除节点', `确定要彻底删除监控节点【${site.name}】吗？此操作将更新 KV 数据库。`);
  if (!confirmed) return;

  const token = sessionStorage.getItem('edgepulse_token');
  const updatedSites = (cachedConfig.sites || []).filter((_, i) => i !== index);

  const updatedConfig = { ...cachedConfig, sites: updatedSites };
  await saveConfig(updatedConfig, token, `监控节点【${site.name}】已从 KV 数据库删除！`);
  renderSitesTable(cachedConfig.sites || []);
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
  // Always keep local memory in sync
  cachedConfig = configPayload;
  localStorage.removeItem('edgepulse_local_config');

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

    if (!res.ok) {
      const errorMsg = data.error || `请求失败 (HTTP ${res.status})`;
      showToast(errorMsg, 'error', '保存失败');
      return false;
    }

    showToast(successMsg, 'success', '系统提示');
    fillSettingsForm(cachedConfig);
    renderSitesTable(cachedConfig.sites || []);
    updateAvailableChannelsAndGroups(cachedConfig);

    // Trigger instant background probe cycle for new/updated sites
    fetch('/api/cron').catch(() => {});
    return true;
  } catch (err) {
    showToast(err.message || '网络无法连接到配置服务端', 'error', '保存失败');
    return false;
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

function updateTotpQrCode() {
  const input = document.getElementById('settingTotpSecret');
  const secret = input ? input.value.trim().toUpperCase() : '';
  const totpQrBox = document.getElementById('totpQrBox');
  const totpQrImg = document.getElementById('totpQrImg');
  const totpSecretDisplay = document.getElementById('totpSecretDisplay');
  const totpOtpUrl = document.getElementById('totpOtpUrl');

  if (!secret) {
    if (totpQrBox) totpQrBox.style.display = 'none';
    return;
  }

  const cleanSecret = secret.replace(/[^A-Z2-7]/g, '');
  const otpUrl = `otpauth://totp/EdgePulse:admin?secret=${cleanSecret}&issuer=EdgePulse`;

  if (totpSecretDisplay) totpSecretDisplay.textContent = cleanSecret.match(/.{1,4}/g)?.join(' ') || cleanSecret;
  if (totpOtpUrl) totpOtpUrl.textContent = otpUrl;

  if (totpQrImg) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpUrl)}`;
    totpQrImg.src = qrApiUrl;
    totpQrImg.onerror = function() {
      totpQrImg.src = `https://chart.googleapis.com/chart?cht=qr&chs=180x180&chl=${encodeURIComponent(otpUrl)}`;
    };
  }

  if (totpQrBox) totpQrBox.style.display = 'flex';
}

function generateNewTotpSecret() {
  const newSecret = generateBase32Secret();
  safeSetValue('settingTotpSecret', newSecret);
  updateTotpQrCode();
  showToast('已生成新的 2FA 动态秘钥与绑定二维码', 'success', '2FA 设置');
}

function copyTotpSecret() {
  const secret = document.getElementById('settingTotpSecret')?.value.trim();
  if (!secret) {
    showToast('当前无有效 2FA 密钥可供复制', 'warning', '2FA 设置');
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(secret).then(() => {
      showToast('2FA 密钥已成功复制到剪贴板', 'success', '2FA 设置');
    }).catch(() => {
      showToast('复制失败，请手动选择复制', 'error', '2FA 设置');
    });
  } else {
    showToast('2FA 密钥：' + secret, 'info', '2FA 密钥');
  }
}

/* DEV Mock Data Generator (3 items for each of the 5 monitoring types = 15 items total) */
async function loadMockDevSites() {
  const mockSites = [
    // 1. HTTP(S) 3个
    {
      id: `site-mock-http-1`,
      name: 'EdgePulse 官网主站',
      type: 'http',
      url: 'https://pulse.eallion.com',
      checkDomain: true,
      checkSsl: true,
      domainWarnDays: 30,
      sslWarnDays: 30,
      alertChannels: ['lark']
    },
    {
      id: `site-mock-http-2`,
      name: 'Cloudflare API Gateway',
      type: 'http',
      url: 'https://api.cloudflare.com',
      checkDomain: false,
      checkSsl: true,
      domainWarnDays: 30,
      sslWarnDays: 30,
      alertChannels: ['wechat']
    },
    {
      id: `site-mock-http-3`,
      name: 'GitHub Status Center',
      type: 'http',
      url: 'https://www.githubstatus.com',
      checkDomain: false,
      checkSsl: true,
      domainWarnDays: 30,
      sslWarnDays: 30,
      alertChannels: ['telegram']
    },

    // 2. ICMP PING 3个
    {
      id: `site-mock-icmp-1`,
      name: 'Cloudflare Public DNS PING',
      type: 'icmp',
      host: '1.1.1.1',
      alertChannels: ['lark']
    },
    {
      id: `site-mock-icmp-2`,
      name: 'Google Public DNS PING',
      type: 'icmp',
      host: '8.8.8.8',
      alertChannels: ['bark']
    },
    {
      id: `site-mock-icmp-3`,
      name: 'Aliyun DNS PING (国内)',
      type: 'icmp',
      host: '223.5.5.5',
      alertChannels: ['dingtalk']
    },

    // 3. TCP 端口检测 3个
    {
      id: `site-mock-tcp-1`,
      name: 'VPS SSH 远程管理端口 (22)',
      type: 'tcp',
      host: '127.0.0.1:22',
      port: '22',
      alertChannels: ['lark']
    },
    {
      id: `site-mock-tcp-2`,
      name: 'MySQL 核心数据库 (3306)',
      type: 'tcp',
      host: '127.0.0.1:3306',
      port: '3306',
      alertChannels: ['smtp']
    },
    {
      id: `site-mock-tcp-3`,
      name: 'Redis 高速缓存集群 (6379)',
      type: 'tcp',
      host: '127.0.0.1:6379',
      port: '6379',
      alertChannels: ['wechat']
    },

    // 4. DNS 记录检测 3个
    {
      id: `site-mock-dns-1`,
      name: 'Google 域名 IPv4 A 记录',
      type: 'dns',
      host: 'google.com',
      dnsType: 'A',
      dnsExpected: '',
      alertChannels: ['lark']
    },
    {
      id: `site-mock-dns-2`,
      name: 'Cloudflare IPv6 AAAA 记录',
      type: 'dns',
      host: 'cloudflare.com',
      dnsType: 'AAAA',
      dnsExpected: '',
      alertChannels: ['telegram']
    },
    {
      id: `site-mock-dns-3`,
      name: 'GitHub Pages CNAME 校验',
      type: 'dns',
      host: 'github.io',
      dnsType: 'CNAME',
      dnsExpected: '',
      alertChannels: ['wechat']
    },

    // 5. Push 被动打卡 3个
    {
      id: `site-mock-push-1`,
      name: 'NAS 异地定时增量备份打卡',
      type: 'push',
      pushToken: 'pulse_sec_mock_nas_backup_01',
      url: `${window.location.origin}/api/push?token=pulse_sec_mock_nas_backup_01`,
      pushTimeout: 300,
      alertChannels: ['bark']
    },
    {
      id: `site-mock-push-2`,
      name: 'MySQL 数据库每日冷备打卡',
      type: 'push',
      pushToken: 'pulse_sec_mock_mysql_dump_02',
      url: `${window.location.origin}/api/push?token=pulse_sec_mock_mysql_dump_02`,
      pushTimeout: 86400,
      alertChannels: ['smtp']
    },
    {
      id: `site-mock-push-3`,
      name: 'OpenWrt 软路由 Cron 保活打卡',
      type: 'push',
      pushToken: 'pulse_sec_mock_openwrt_cron_03',
      url: `${window.location.origin}/api/push?token=pulse_sec_mock_openwrt_cron_03`,
      pushTimeout: 180,
      alertChannels: ['lark']
    }
  ];

  const updatedConfig = {
    ...cachedConfig,
    sites: [...(cachedConfig.sites || []), ...mockSites],
  };

  const token = sessionStorage.getItem('edgepulse_token');
  await saveConfig(updatedConfig, token, '已为 5 种监控类型成功生成 15 个 DEV 模拟测试数据！');
  switchTab('sites');
}
