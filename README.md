# <img src="public/images/logo.png" width="32" height="32" align="center"> EdgePulse - EdgeOne Makers 原生在线监控与状态页

**EdgePulse** 是一个完全基于 **Tencent EdgeOne Makers** 边缘计算平台构建的高颜值、零服务器维护成本（0 元/极低成本）、全球多节点在线监控与 Status Page。

---

## ✨ 核心特性

- 🛡️ **纯 EdgeOne Serverless 架构**：基于 Edge CDN 静态托管 + V8 Edge Functions + EdgeOne KV Storage，无需配置或购买独立 CVM / Docker。
- 🌐 **多域名动态状态页 (Multi-Domain Status Pages)**：同一套部署服务支持绑定无限个域名（如 `status.a.com`, `status.b.com`），根据访问域名自动匹配展示对应的状态页，**支持针对不同 Status 监控页分配关联特定监控分组（Groups）与特定监控节点（Sites）**。
- 🎨 **Cloudflare Kumo UI 设计系统 (基于 Base UI 代币)**：
  - 🍊 **Kumo 视觉精美美学**：全站整体采用 Cloudflare Kumo 哑光黑 Obsidian 背景、Cloudflare 标志性橙色 Accent（`#f6821f`）、Base UI 细微 1px 细线边框（`#27272a`）及胶囊圆角元素。
  - 🎛️ **Kumo Toggle Switch 开启开关**：设置中所有服务开关全面升级为 Cloudflare Kumo 风格的圆角滑块 Toggle Switch，开启滑动时带有 Cloudflare 橙色高亮与 0.25s 贝塞尔曲线过渡。
  - 💬 **全站淘汰原生浏览器 alert/confirm**：全面接入正宗的 **Cloudflare Kumo UI / Base UI Toast 消息通知框**与 **Kumo Confirm 模态确认对话框**，具备极致高颜值的淡入淡出滑移动效与交互感。
  - 🔄 **前后台全局共享持久化**：前台监控面板 (`index.html`) 与后台控制中心 (`admin.html`) 共享 Kumo UI 主题切换偏好（暗黑/浅色），自动写入 `localStorage` 记忆。
  - 📈 包含动态 Sparkline 耗时、30 天可用率条形图（Uptime Bar）、SSL 证书及域名到期倒计时 Badge、自适应移动端与 30s 自动倒计时刷新。

---

## 🤖 Agent UI 开发约定 (Agent Rules & Aesthetics Directive)

> [!IMPORTANT]
> **全项目 UI 规范约定**：
> 1. 本项目所有前端页面（包含前台 `index.html`、后台 `admin.html` 以及未来新增的所有页面和组件）**必须统一采用基于 Base UI 的 Cloudflare Kumo UI 设计系统**。
> 2. 视觉需维持哑光高质感背景、极简 1px 细线边框、Cloudflare 橙色/Base UI 蓝色调色板、胶囊造型按钮以及无缝平滑微交互。
> 3. 后续所有功能迭代与 UI 更改必须严格遵守此 UI 约定，不得引入杂乱样式或破坏 Kumo UI 整体一致性。
- ⚙️ **前端可视化管理 Modal**：支持在 UI 界面点击【⚙️ 管理监控】弹窗，快速添加监控节点。
  - 📡 **5 大多维监控协议层**：
  - **HTTP(S) 网站 / 接口**：默认以超轻量 `HEAD` 请求打靶（自动降级 `GET`），毫秒级感知 HTTP 状态码与响应延时。集成根域名到期与 SSL 证书智能检测。
  - **ICMP PING 探针**：基于 Cloudflare / EdgeOne 边缘网络向目标主机/VPS 发起 ICMP PING，实时记录丢包率与网络延迟。
  - **TCP 端口连通性检测**：精准探测数据库、SSH、Redis、自定义服务端口（如 `22`, `3306`, `6379`, `8080`）的开放与响应状态。
  - **DNS 记录解析检测 (DoH)**：基于 DNS-over-HTTPS 原生支持 `A` / `AAAA` / `CNAME` / `MX` / `TXT` / `NS` / `CAA` 记录类型的有效解析与响应值比对匹配。
  - **Push 被动心跳打卡 (Dead Man)**：专为无公网 IP 的内网设备、NAS、Cron 定时任务设计的“被动打卡”监控模式。若在预定周期内未收到 Pulse 打卡信号，自动触发断网告警。
  - 🔍 **内容/关键字匹配**：校验 Response Body 字符串或 JSON 路径值，防止假死报错。
  - 🔒 **SSL/TLS 证书到期预警**：自动解析 HTTPS 证书到期时间，默认提前 30 天开启预警推送。
  - 🌐 **根域名/子域名智能识别到期监控 (WHOIS/RDAP)**：
    - **根域名 (Apex Domain，如 `eallion.com`)**：自动提供【域名到期监控】与【SSL 证书到期监控】双开关。
    - **子域名 (Subdomain，如 `demo.eallion.com`)**：自动隐藏域名到期，仅保留【SSL 证书到期监控】。
    - **自定义检查频率与告警阈值**：支持选择到期检查频率（`Daily` 每天 / `Weekly` 每周 / `Monthly` 每月）以及自定义提前提醒天数（默认均为 30 天）。
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

- 🔐 **后台独立管理面板 (`/admin.html`)**：访问入口地址为 **`https://your-domain.com/admin.html`**，支持默认 `admin/admin` 登录与旧密码校验修改。包含四大高效控制模块：
  - 🌐 **站点基本信息配置 (Title & Favicon)**：支持自定义配置全站 **站点标题 (Title)** 及 **Favicon 浏览器图标**（支持在线图片 URL 填入，或选择本地图片自动转为 `data:image/png;base64` 文本存储存入 KV 数据库，实现零外链零依赖的本地图标化）。
  - 🌐 **站点基本配置与 ICP 备案号**：支持在后台自定义配置 ICP 备案号（如 `粤ICP备12345678号-1`），配置后会自动动态渲染在公共状态页 Footer 的【刷新 (30s)】文本左侧（留空则自动隐藏）。
  - 🔑 **Passkey 无密码极速登录 (WebAuthn)**：原生支持 Bitwarden 插件弹窗、macOS TouchID/FaceID 及 YubiKey 硬件密钥注册与免密登录。
  - 🛡️ **2FA 双因素身份验证 (TOTP)**：支持生成专属 Base32 密钥与实时渲染绑定二维码，扫码轻松绑定 Bitwarden、1Password 或 Google Authenticator 等身份验证器，登录时进行 RFC 6238 标准 6 位数动态验证。
  - 🤖 **Cloudflare Turnstile 人机防护 (默认关闭)**：支持集成 Cloudflare 隐形人机验证，并**原生支持 Cloudflare 官方 Dev Site Keys 调试**（`1x00000000000000000000AA` 总是通过 / `2x00000000000000000000AB` 总是拦截）。
  - 📍 **节点列表与管理**：查看/创建/删除监控节点，节点本身保持纯粹（无需设置分组），支持按节点联动勾选仅属于该节点的告警通道（如仅给节点 A 勾选飞书、节点 B 勾选 Telegram+Email）。
  - ⚙️ **合并统一设置与多域名 Status 监控页**：
    - 🔔 **多渠道告警通道配置 (显式 Switch 开关控制)**：包含飞书、企业微信、钉钉、Telegram、Bark、PushPlus (推送加) 及 **Email 邮件通知设置** (支持配置 SMTP Host/Port/User/Pass、独立发件人显示名称 `From Sender` 及接收邮箱)。每个服务均提供独立的“启用此服务”开关控制。
    - 📂 **自定义分组管理与 Status 页面节点划归**：支持在【设置】与【Status 监控页】中随时双向同步创建/管理分组；在 Status 监控页中可自由为各个分组划归归属监控节点，前台按页面划归的分组美观呈现卡片列表。
    - 🔑 **管理员账号密码修改**：支持旧密码验证与**新密码二次输入相同确认**防错机制。
    - 📦 **配置备份导出/恢复导入与重置**：支持一键导出包含全量监控节点与告警渠道的 `.json` 备份文件，并提供严格格式校验的恢复导入；页面无常驻冗余警告说明，点击【⚠️ 重置清空系统 KV 数据】按钮即刻弹出集成了**红框高危警示说明**与**管理员密码安全核验**的一体化确认 Modal，验证通过后彻底擦除 KV 存储数据。

---

## 📡 Push 被动心跳打卡模式指南 (Push / Dead Man's Snitch)

**Push 模式** 是一种“反向报平安”的监控机制。非常适合用于 **无公网 IP 设备**（如家里的 NAS、软路由）、**全防火墙拦截阻断端口的主机**，以及 **Cron 定时备份脚本**。

### 1. 运行原理
在 EdgePulse 控制台添加类型为 `Push 被动打卡` 的监控节点，系统会自动生成唯一的专属打卡 URL（如 `https://your-domain.com/api/push?token=pulse_xxxxxx`）。目标设备按周期请求该 URL 打卡。若在设定时间内未收到打卡信号，系统将自动触发断网/失联告警。

### 2. 使用方法示范

- **Linux Crontab 定时打卡（如每 5 分钟打卡一次）**：
  ```bash
  */5 * * * * curl -s "https://your-domain.com/api/push?token=pulse_xxxxxx" > /dev/null
  ```
- **Shell 备份脚本成功后打卡**：
  ```bash
  #!/bin/bash
  # 运行数据库备份
  mysqldump -u root -p'password' my_db > backup.sql

  # 备份成功后发起打卡
  if [ $? -eq 0 ]; then
    curl -s "https://your-domain.com/api/push?token=pulse_xxxxxx"
  fi
  ```

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
