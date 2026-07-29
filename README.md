# ⚡ EdgePulse - EdgeOne Makers 原生在线监控与状态页系统

**EdgePulse** 是一个完全基于 **Tencent EdgeOne Makers** 边缘计算平台构建的高颜值、零服务器维护成本（0 元/极低成本）、全球多节点在线监控与 Status Page 系统。

---

## ✨ 核心特性

- 🛡️ **纯 EdgeOne Serverless 架构**：基于 Edge CDN 静态托管 + V8 Edge Functions + EdgeOne KV Storage，无需配置或购买独立 CVM / Docker。
- 🌐 **多域名动态状态页 (Multi-Domain Status Pages)**：同一套部署服务支持绑定无限个域名（如 `status.a.com`, `status.b.com`），根据访问域名自动匹配展示对应的状态页与专属服务节点。
- 📊 **现代暗黑 Glassmorphism 界面**：高颜值玻璃拟物风格 UI，包含动态 Sparkline 耗时、30 天可用率条形图（Uptime Bar）、SSL 证书及域名到期倒计时 Badge、自适应移动端与 30s 自动倒计时刷新。
- ⚙️ **前端可视化管理 Modal**：支持在 UI 界面点击【⚙️ 管理监控】弹窗，快速添加 HTTP(S)、ICMP、TCP 端口、域名到期或 Push 心跳监控节点。
  - 🟢 **HTTP(S) 状态码与延迟**：**默认使用极轻量 `HEAD` 请求**（只请求 Headers、不下载 Response Body、零服务器流量与内存开销）；当目标站点不支持 `HEAD` 返回 `545` (Unknown Status) 或 `405` (Method Not Allowed) 等边缘/防刷错误时，**自动智能降级重试 `GET` 请求**，保证零误报。支持自定义方法。
  - 🔍 **内容/关键字匹配**：校验 Response Body 字符串或 JSON 路径值，防止假死报错。
  - 🔒 **SSL/TLS 证书到期预警**：自动解析 HTTPS 证书到期时间，提前 14/7 天告警。
  - 🌐 **域名到期监控 (WHOIS/RDAP)**：查询 `.com/.cn` 等全网域名到期时间，提前 30 天续费提醒。
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

- **管理后台入口**：`/admin.html`（或 `/admin`）
- **默认初始账号**：`admin`
- **默认初始密码**：`admin`

*可以在后台【🔑 修改账号密码】面板中输入旧密码后随时更新为自定义的新用户名与新密码，修改后存储于 EdgeOne KV (`config:auth`) 中。*

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
