# 将访问统计部署到 Cloudflare

前台继续使用 GitHub Pages；Cloudflare 只运行统计接口、管理页面和数据库。
无需迁移网站或先购买域名，可先使用 Cloudflare 分配的 workers.dev 地址。
本目录已经备好 Worker 入口、数据库结构和部署配置，但尚未创建线上资源。

## 1. 登录 Cloudflare

在 https://dash.cloudflare.com/ 注册并登录账号。
在本项目的 `analytics` 目录打开终端：

```bash
cd /Users/alice/Documents/01_code/00_my_journey/Worst-Case-A-Bug/analytics
npx wrangler@4 login
```

浏览器会打开授权页面，请使用准备托管统计的账号完成授权。
这些命令会按需从 npm 获取官方 Wrangler 工具。

## 2. 创建 D1 数据库

```bash
npx wrangler@4 d1 create wcab-analytics
```

命令会返回 `database_id`。打开本目录 `wrangler.toml`，将
`database_id` 中的全零占位值替换为该 ID。
保留绑定名称 `DB`，不要改成数据库名称。

确认同一文件中的两个非密钥配置：

- `ALLOWED_ORIGINS`：前台网站的 origin，例如 `https://alice314159.github.io`。
  不包含仓库路径，也不带末尾斜杠；多个来源用英文逗号分隔。
- `SITE_URL`：前台首页完整 URL，例如
  `https://alice314159.github.io/Worst-Case-A-Bug/`，以实际发布地址为准。

如果日后使用自定义域名，也要将其 origin 加入 `ALLOWED_ORIGINS`。

## 3. 初始化表并部署后台

仍在 `analytics` 目录执行：

```bash
npx wrangler@4 d1 execute wcab-analytics --remote --file=schema.sql
npx wrangler@4 deploy
```

记录命令返回的 Worker HTTPS 地址。
配置中的静态资源目录仅为 `../admin`，不要改成项目根目录。
管理页面地址是 Worker 地址加 `/admin/`。

## 4. 设置两个加密变量

分别生成两个不同的随机值，并安全保存。例如每次运行下面命令生成一个：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

然后执行：

```bash
npx wrangler@4 secret put ADMIN_TOKEN
npx wrangler@4 secret put VISITOR_SALT
```

按提示分别粘贴两个值：

- `ADMIN_TOKEN`：登录统计后台时使用的管理密钥。
- `VISITOR_SALT`：给每日会话做匿名哈希的服务端密钥，不用于登录。

不要把密钥写进 wrangler.toml、前台 JS、GitHub 或聊天消息。
首次部署后、两个密钥尚未设置时，采集和管理功能不会正常启用。
不要随意更换 VISITOR_SALT，否则当日会话去重口径会发生变化。

## 5. 接通前台网站

编辑项目根目录下的 `js/analytics-config.js`，把 `endpoint` 的空字符串
替换成部署命令返回的 Worker 根地址，不要带 `/api/collect` 或 `/admin/`：

```javascript
window.siteAnalytics = {
  endpoint: 'https://实际的Worker地址.workers.dev',
  localEndpoint: 'http://127.0.0.1:8788'
};
```

配置中填写的是公开服务地址，不是密钥。
为避开旧浏览器缓存，发布前更新各页面 analytics-config.js 的版本查询参数。
将前台修改提交到 GitHub，并等待 GitHub Pages 更新后，线上访问才会开始采集。
本地访问仍发给本地服务，避免混入线上统计。

## 6. 验证上线

1. 打开 Worker 地址加 `/api/health`，确认返回 `ok: true`、`mode: cloud`。
2. 打开实际 GitHub Pages 网站中的一两个页面。
3. 打开 Worker 地址加 `/admin/`，输入 ADMIN_TOKEN。
4. 刷新统计，确认收到真实页面路径。浏览器启用 DNT/GPC 时不会采集。
5. 国家、地区和城市取自 Cloudflare 的请求地域元数据；部分请求仍可能未知，
   不会请求访客的精确定位，也不会将原始 IP 保存到 D1。

本地历史数据不会自动上传到线上。新 D1 数据库从零开始统计。
每天 03:00 UTC 定时清理超出 90 天的记录，采集时也会清理。
本项目的匿名采集只提供轻量校验与按会话限额，并非防刷量平台。

## 文件对应

| 文件 | 用途 |
| --- | --- |
| worker.mjs | Cloudflare 请求入口、管理页面路由、定时清理 |
| core.mjs | 与本地版共享的采集及授权统计接口 |
| schema.sql | D1 数据表与索引 |
| wrangler.toml | Worker、D1、静态管理页和允许来源的配置 |
| ../admin/ | 管理页静态文件，不包含密钥或本地数据库 |
| ../js/analytics-config.js | 前台需要连接的公开接口地址 |

## 官方资料

- D1 入门：https://developers.cloudflare.com/d1/get-started/
- Workers 静态资源：https://developers.cloudflare.com/workers/static-assets/binding/
- 加密变量：https://developers.cloudflare.com/workers/configuration/secrets/
- workers.dev 地址：https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- 请求地域元数据：https://developers.cloudflare.com/workers/runtime-apis/request/
- 定时任务：https://developers.cloudflare.com/workers/configuration/cron-triggers/
