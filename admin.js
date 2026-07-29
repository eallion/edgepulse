/**
 * EdgePulse Admin Dashboard Logic
 * Handles Authentication, Token persistence, Site CRUD, Alert Config, and Password Updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

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
  const tabs = ['sites', 'addSite', 'alerts', 'security'];
  tabs.forEach(t => {
    document.getElementById(`tab-${t}`).style.display = t === tabName ? 'block' : 'none';
  });

  const tabItems = document.querySelectorAll('.tab-item');
  tabItems.forEach((el, idx) => {
    el.classList.toggle('active', tabs[idx] === tabName);
  });
}

function toggleAdminFormFields() {
  const type = document.getElementById('newSiteType').value;
  document.getElementById('adminUrlGroup').style.display = (type === 'http') ? 'block' : 'none';
  document.getElementById('adminHostGroup').style.display = (type === 'icmp' || type === 'tcp') ? 'block' : 'none';
  document.getElementById('adminDomainGroup').style.display = (type === 'domain') ? 'block' : 'none';
}

let cachedConfig = { sites: [], alerts: {} };

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    cachedConfig = await res.json();
    renderSitesTable(cachedConfig.sites || []);
    fillAlertsForm(cachedConfig.alerts || {});
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function renderSitesTable(sites) {
  const tbody = document.getElementById('sitesTableBody');
  tbody.innerHTML = '';

  if (sites.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">暂无监控节点，请在【➕ 添加监控节点】中添加</td></tr>';
    return;
  }

  sites.forEach((site, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${site.name}</strong></td>
      <td><span class="badge badge-operational">${site.type.toUpperCase()}</span></td>
      <td>${site.url || site.host || site.domain || '-'}</td>
      <td>${site.group || '默认分组'}</td>
      <td>
        <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--color-red);" onclick="deleteSite(${index})">删除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function fillAlertsForm(alerts) {
  if (alerts.larkWebhook) document.getElementById('alertLark').value = alerts.larkWebhook;
  if (alerts.wechatWebhook) document.getElementById('alertWechat').value = alerts.wechatWebhook;
  if (alerts.telegramToken) document.getElementById('alertTgToken').value = alerts.telegramToken;
  if (alerts.telegramChatId) document.getElementById('alertTgChatId').value = alerts.telegramChatId;
  if (alerts.barkUrl) document.getElementById('alertBark').value = alerts.barkUrl;
}

async function handleCreateSite(event) {
  event.preventDefault();
  const token = sessionStorage.getItem('edgepulse_token');
  const type = document.getElementById('newSiteType').value;
  const name = document.getElementById('newSiteName').value;
  const url = document.getElementById('newSiteUrl').value;
  const host = document.getElementById('newSiteHost').value;
  const domain = document.getElementById('newSiteDomain').value;
  const group = document.getElementById('newSiteGroup').value;

  const newSite = {
    id: `site-${Date.now()}`,
    name,
    type,
    group,
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

async function handleSaveAlerts(event) {
  event.preventDefault();
  const token = sessionStorage.getItem('edgepulse_token');
  const alerts = {
    larkWebhook: document.getElementById('alertLark').value,
    wechatWebhook: document.getElementById('alertWechat').value,
    telegramToken: document.getElementById('alertTgToken').value,
    telegramChatId: document.getElementById('alertTgChatId').value,
    barkUrl: document.getElementById('alertBark').value,
  };

  const updatedConfig = { ...cachedConfig, alerts };
  await saveConfig(updatedConfig, token, '✅ 告警通道配置保存成功！');
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

async function handleChangePassword(event) {
  event.preventDefault();
  const oldPassword = document.getElementById('secOldPassword').value;
  const newUsername = document.getElementById('secNewUsername').value;
  const newPassword = document.getElementById('secNewPassword').value;

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newUsername, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(`修改失败: ${data.error}`);
      return;
    }

    alert('✅ 账号密码修改成功！请重新登录。');
    handleLogout();
  } catch (err) {
    alert(`修改异常: ${err.message}`);
  }
}
