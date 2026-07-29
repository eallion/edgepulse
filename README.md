# ⚡ EdgePulse - EdgeOne Makers 原生在线监控与状态页系统

**EdgePulse** 是一个完全基于 **Tencent EdgeOne Makers** 边缘计算平台构建的高颜值、零服务器维护成本（0 元/极低成本）、全球多节点在线监控与 Status Page 系统。

---

## ✨ 核心特性

- 🛡️ **纯 EdgeOne Serverless 架构**：基于 Edge CDN 静态托管 + V8 Edge Functions + EdgeOne KV Storage，无需配置或购买独立 CVM / Docker。
- 🌐 **多域名动态状态页 (Multi-Domain Status Pages)**：同一套部署服务支持绑定无限个域名（如 `status.a.com`, `status.b.com`），根据访问域名自动匹配展示对应的状态页与专属服务节点。
- 🎨 **Cloudflare Kumo UI 设计系统 (基于 Base UI 代币)**：
  - 🍊 **Kumo 视觉精美美学**：全站整体采用 Cloudflare Kumo 哑光黑 Obsidian 背景、Cloudflare 标志性橙色 Accent（`#f6821f`）、Base UI 细微 1px 细线边框（`#27272a`）及胶囊圆角元素。
  - 🔄 **前后台全局共享持久化**：前台监控面板 (`index.html`) 与后台控制中心 (`admin.html`) 共享 Kumo UI 主题切换偏好（暗黑/浅色），自动写入 `localStorage` 记忆。
  - 📈 包含动态 Sparkline 耗时、30 天可用率条形图（Uptime Bar）、SSL 证书及域名到期倒计时 Badge、自适应移动端与 30s 自动倒计时刷新。

---

## 🤖 Agent UI 开发约定 (Agent Rules & Aesthetics Directive)

> [!IMPORTANT]
> **全项目 UI 规范约定**：
> 1. 本项目所有前端页面（包含前台 `index.html`、后台 `admin.html` 以及未来新增的所有页面和组件）**必须统一采用基于 Base UI 的 Cloudflare Kumo UI 设计系统**。
> 2. 视觉需维持哑光高质感背景、极简 1px 细线边框、Cloudflare 橙色/Base UI 蓝色调色板、胶囊造型按钮以及无缝平滑微交互。
> 3. 后续所有功能迭代与 UI 更改必须严格遵守此 UI 约定，不得引入杂乱样式或破坏 Kumo UI 整体一致性。
- ⚙️ **前端可视化管理 Modal**：支持在 UI 界面点击【⚙️ 管理监控】弹窗，快速添加 HTTP(S)、ICMP、TCP 端口、域名到期或 Push 心跳监控节点。
  - 🟢 **HTTP(S) 状态码与延迟**：**默认使用极轻量 `HEAD` 请求**（只请求 Headers、不下载 Response Body、零服务器流量与内存开销）；当目标站点不支持 `HEAD` 返回 `545` (Unknown Status) 或 `405` (Method Not Allowed) 等边缘/防刷错误时，**自动智能降级重试 `GET` 请求**，保证零误报。支持自定义方法。
  - 🔍 **内容/关键字匹配**：校验 Response Body 字符串或 JSON 路径值，防止假死报错。
  - 🔒 **SSL/TLS 证书到期预警**：自动解析 HTTPS 证书到期时间，可设置提前通知天数（如 14/7 天）。
  - 🌐 **根域名/子域名智能识别到期监控 (WHOIS/RDAP)**：
    - **根域名 (Apex Domain，如 `eallion.com`)**：自动提供【域名到期监控】与【SSL 证书到期监控】双开关。
    - **子域名 (Subdomain，如 `demo.eallion.com`)**：自动隐藏域名到期（无独立注册到期日），仅保留【SSL 证书到期监控】。
    - **自定义检查频率与告警阈值**：支持选择到期检查频率（`Daily` 每天 / `Weekly` 每周）以及自定义提前提醒天数（如域名提前 30 天，SSL 提前 14 天），告警通知与节点已勾选的通知渠道共享。
  - 📡 **原生 ICMP PING**：通过 Cloud Functions 节点支持原始 ICMP 报文探测，监控只响应 PING 的 VPS。
  - 💓 **Push 被动心跳打卡**：支持异地服务器/备份脚本被动 HTTP 心跳打卡（Dead Man's Snitch）。
- 🔔 **丰富多渠道告警通知**：
  - 飞书 (Lark) 富文本卡片、企业微信 Markdown 消息、钉钉加签机器人
  - Telegram Bot 即时消息、Discord / Slack 团队频道
  - Bark (iOS 离线强提醒)、PushDeer、Server酱 / Gotify
  - Resend HTTP API 及标准 **SMTP 邮件发送**（支持 QQ/163/Gmail/企业邮等）
  - 自定义通用 POST Webhook 接入（支持 N8N / AlertManager）

---

## 🛠️ 项目结构

```
.
├── .gitignore                   # Git 忽略文件规则
├── index.html                   # 静态监控面板 UI (前台纯粹展示)
├── index.css                    # Glassmorphism 样式系统与 Token
├── index.js                     # 状态页数据交互与图表渲染
├── admin.html                   # 控制台管理后台 (登录与节点/告警/密码管理)
├── admin.js                     # 后台控制逻辑与鉴权控制器
├── edgeone.json                 # EdgeOne Makers 平台配置文件
├── README.md                    # 项目使用与部署说明文档
└── functions/
    └── api/
        ├── status.js            # [Edge Function] 状态查询与 24h 历史线图 API (支持多域名感知)
        ├── cron.js              # [Edge Function] 核心心跳巡检与多渠道 Webhook 告警引擎
        ├── auth/
        │   ├── login.js         # [Edge Function] 管理员登录校验 API
        │   └── change-password.js # [Edge Function] 密码修改 API
        ├── push.js              # [Edge Function] VPS / 备份脚本被动心跳打卡 API
        └── icmp-ping.js         # [Cloud Function] 屏蔽端口 VPS 的 ICMP Ping / TCP Port 探针
```

---

## 🔐 独立管理后台与默认登录凭据

- 🔐 **后台独立管理面板 (`/admin.html`)**：支持默认 `admin/admin` 登录与旧密码校验修改。包含三大高效控制模块：
  - 📍 **节点列表与管理**：查看/创建/删除监控节点，**按节点联动勾选仅属于该节点的告警通道**（如仅给节点 A 勾选飞书、节点 B 勾选 Telegram+Email）。
  - ⚙️ **合并统一设置**：
    - 🔔 **多渠道告警通道配置 (显式 Switch 开关控制)**：包含飞书、企业微信、钉钉、Telegram、Bark、**PushPlus (推送加微信公众号推送)** 及 **Email 邮件通知设置** (支持配置 SMTP 及接收邮箱)。每个服务均提供独立的“启用此服务”开关控制。
    - 📂 **自定义分组管理**：支持独立输入框“一个一个添加新分组”，已建分组展示为 Tag 标签，支持点击 `✕` 随时移除。
    - 🔑 **管理员账号密码修改**。

---

## 📡 API 接口一览

- **`GET /api/status`**：拉取当前状态页所有节点的实时快照、SLA %、24h 延时线图及 SSL/域名剩余天数（自动感知 `Host` 域名多租户展示）。
- **`GET/POST /api/cron`**：触发边缘全量巡检、并发探测目标、更新 KV 存储并推送 Webhook 告警。
- **`GET/POST /api/config`**：管理监控配置（新增/修改站点、多域名组映射、Webhook 密钥）。需带 `Authorization: Bearer <ADMIN_API_KEY>`。
- **`GET /api/push?token=YOUR_KEY`**：被动打卡接口（用于被动监控被关端口的 VPS）。
- **`GET /api/icmp-ping?host=x.x.x.x&type=icmp`**：Cloud Function 原生 ICMP / TCP 端口探针。

---

## 🚀 快速开始与本地开发

### 1. 关联与启动本地调试

```bash
# 关联远端 EdgeOne Makers 项目
edgeone makers link

# 启动本地开发服务器 (默认端口 8088)
edgeone makers dev
```

在浏览器打开 `http://localhost:8088` 即可预览状态面板。

---

## 📦 线上部署与 EdgeOne 配置

### 1. 控制台开启 KV Storage 并绑定

1. 登录 [EdgeOne Makers 控制台](https://console.cloud.tencent.com/edgeone/pages)。
2. 进入 **KV Storage** 页面，申请开通并创建一个 Namespace（如 `edgepulse_store`，仅支持字母、数字、下划线）。
3. 在项目设置中绑定该 Namespace，并将其**变量名设为 `MONITOR_KV`**。

### 2. 执行一键部署

```bash
edgeone makers deploy
```

部署完成后，CLI 将自动输出生成的线上预览域名及控制台管理地址。
