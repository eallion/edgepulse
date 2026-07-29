/**
 * EdgePulse Admin Dashboard Logic
 * Handles Authentication, Consolidated Settings (Alerts, Groups, Email, Security),
 * and Node CRUD with dynamic Alert Channel selections.
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
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">暂无监控节点，请在【➕ 添加监控节点】中添加</td></tr>';
    return;
  }

  sites.forEach((site, index) => {
    const tr = document.createElement('tr');
    const channelsText = (site.alertChannels && site.alertChannels.length > 0) 
      ? site.alertChannels.map(getChannelLabel).join(', ') 
      : '无 (跟随默认)';

    tr.innerHTML = `
      <td><strong>${site.name}</strong></td>
      <td><span class="badge badge-operational">${site.type.toUpperCase()}</span></td>
      <td>${site.url || site.host || site.domain || '-'}</td>
      <td>${site.group || '默认分组'}</td>
      <td><span style="font-size: 0.8rem; color: var(--color-accent);">${channelsText}</span></td>
      <td>
        <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--color-red);" onclick="deleteSite(${index})">删除</button>
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
    email: 'Email 邮件',
  };
  return map[key] || key;
}

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

  const groupsArr = config.groups || ['核心服务', '网站节点', 'VPS 服务器', '域名资产'];
  document.getElementById('settingGroups').value = groupsArr.join(', ');
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

  // Populate Group Select Options
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

  // Selected Alert Channels
  const selectedChannels = Array.from(document.querySelectorAll('input[name="alertChannel"]:checked')).map(el => el.value);

  const newSite = {
    id: `site-${Date.now()}`,
    name,
    type,
    group,
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

  // 1. Process Alert Channels
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

  // 2. Process Groups
  const groupsInput = document.getElementById('settingGroups').value;
  const groups = groupsInput.split(/[,，]/).map(g => g.trim()).filter(Boolean);

  const updatedConfig = { ...cachedConfig, alerts, groups };
  await saveConfig(updatedConfig, token, '✅ 设置与告警配置保存成功！');

  // 3. Process Password Modification if entered
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
