# Fraq 框架参考（fraqjs/fraq）

SUMMARY: fraq 是面向 Milky 协议的 TypeScript 聊天机器人框架；核心 API、Hono 服务、milky-server 代理与 webui-gateway 挂载机制都在此参考中。
READ WHEN: 当需要实现或理解 fraq 应用、fraq 插件、或 fraq-webui 相关功能时

---

## 是什么

- TypeScript 聊天机器人框架，面向 Milky 协议（QQ 聊天平台），Node.js 22+，npm 包 `@fraqjs/fraq`。
- 官方文档 https://fraq.dev；源码克隆在 `reference/fraq/`（gitignore，不入库）；GitHub: https://github.com/fraqjs/fraq。
- Milky 协议版本 1.3（`milkyVersion`），协议类型定义在 `packages/fraq/src/protocol/types.ts`（约 5400 行，含 `_ZodInput` 输入变体）。

## 仓库结构（monorepo，pnpm workspaces）

- `packages/fraq` — 核心框架；`packages/cli` — CLI（fraq.yml 配置启动）；`packages/color-log`、`packages/takumi-preview`。
- `plugins/` — hono、milky-server、webui-gateway、ai、conversation、kysely、message-store、mock、random、takumi、milky-webhook。
- `docs/` — 文档站；`docs/content/docs/development/` 下有 start/command/message/plugin/protocol 等指南。

## 核心概念与 API

- **Context**：`Context.fromUrl(url, { accessToken })` 连接 Milky 协议端（HTTP API + WebSocket 事件，自动指数退避重连）；生命周期 `ctx.start()` / `ctx.stop()`，状态 idle→starting→started→stopping→stopped。
- **指令路由**：`ctx.router.command('name').arg('k', param.str()/num()/greedy()/catchAll()/union(...)/literal(x)/segment('mention'|'image'...)).describe().alias().tag().execute((session, params) => ...)`；`group('name')` 子命令；`rawPattern()` 直接匹配消息开头；`filter(predicate)` 按 session 分流。参数用 TypeScript 自动推断类型。
- **事件**：`ctx.on('message_receive' | 'message_recall' | 'group_join_request' | ...， handler)`，返回取消监听的 `off()`；事件对象含 `event_type` / `time` / `self_id` / `data`。
- **消息**：`session.reply(text | segments, { withMention, withQuote })`；`session.reaction(type, id)`；`msg` 模板标签 + `seg.mention()/face()/reply()/image()/record()/video()/forward()` 构造 segments。
- **API 调用**：`ctx.client.<endpoint>(params)`，端点全部 snake_case（`get_login_info`、`send_group_message`、`get_group_list`、`get_history_messages` 等），类型齐全。
- **插件与服务**：`definePlugin({ name, inject, optionalInject, provides, apply(ctx, ...args), start })`；服务用 `ctx.provide/resolve/isProvided`，`ServiceToken` 做可选依赖，插件按依赖自动拓扑排序；实现 `Disposable.dispose()` 会在 Context 停止时被调用。
- **子上下文**：`ctx.fork(name, filter)`；`filter.group(群号)/friend()/sender()/admin()/and/or/not`。

## HTTP 与服务器

- **@fraqjs/plugin-hono**：提供 `HonoService`（Hono + @hono/node-server，默认 127.0.0.1:4649，支持 WebSocket upgrade）。
- **@fraqjs/plugin-milky-server**：把 Milky 服务代理成 HTTP：`POST {prefix}/api/:api`（转发 `ctx.client`，响应 `{status, retcode, data|message}`）；`GET {prefix}/event` 同时支持 SSE 和 WebSocket 推送事件；prefix 默认 `/milky`，可配 accessToken。
- **@fraqjs/plugin-webui-gateway**：统一 SPA 挂载 `/webui/<plugin-id>/`，登录页 `/webui/login`（accessToken 换取签名 HttpOnly Cookie，默认 7 天），`/webui/auth/session` 查会话；插件通过 `WebuiGatewayService.mount({ assets, entry?, routes(api){get/post/put/patch/delete} })` 挂载自己的 SPA + `/api` 路由；静态文件走 serveStatic，仅 Accept: text/html 的无扩展名 GET 回退 index.html；默认安全头 + CSP。自带登录/索引小 SPA（React + Vite，在 `plugins/webui-gateway/webui/`）。

## fraq CLI 命令（packages/cli/src/index.ts）

- `fraq start [--no-install] [--watch]` — 启动应用；默认先 `lock` 自动补全插件版本再安装依赖。`--watch` 与 `--no-install`/`--frozen-lockfile` 互斥。
- `fraq install`（别名 `i`）— 只安装依赖，不启动应用。
- `fraq wizard`（别名 `init`/`setup`）— 交互式初始化新项目：项目名（默认 my-fraq-app）、fraq 版本、Milky 地址/端口（默认 localhost:30001），生成 `fraq.yml`（configVersion/fraqVersion/milky.url），**不包含 accessToken**，之后提示用户 `cd <dir> && fraq start`。
- `fraq lock` / `fraq outdated` / `fraq update` / `fraq version`（别名 `v`）— 版本锁定、检查更新、交互更新、显示 CLI 版本。

## Milky 协议端（协议实现）

- Milky 是 QQ 机器人应用接口标准（milky.ntqqrev.org），协议端 = 具体实现，常见的有 Yogurt、Matcha、LuckyLilliaBot、Lagrange.Milky。
- **Yogurt**（SaltifyDev/yogurt-releases + LagrangeDev/acidify）是官方参考实现：Windows x64 / macOS arm64 / Linux x64+arm64，PC/Android 两种登录，HTTP + WebSocket 接口（默认 30001 端口）。
- Yogurt 安装：`npm install -g @acidify/yogurt`（预编译二进制 npm 包），装好后直接 `yogurt` 命令启动；首次启动需要扫码登录 QQ。也可从 SaltifyDev/yogurt-releases Releases 下载压缩包。
- fraq CLI 安装：`npm install -g @fraqjs/cli`。
- 连通性检查：向 Milky 地址 `POST /api/get_login_info`（带 accessToken 时加 `Authorization: Bearer <token>`），返回 `{status:'ok'}` 即协议端可用。
- GitHub 资产下载会 302 跳转到 release-assets.githubusercontent.com；Node undici `fetch` 流式下载对该 CDN 会间歇 `UND_ERR_CONNECT_TIMEOUT`（国内网络），用 `node:https` 手写重定向 + 30s 超时 + 一次重试更稳。

## 对 fraq-webui 的启示

- 两种现成接入方式：a) 作为 fraq 插件用 webui-gateway 挂载（同进程、自带鉴权与静态托管）；b) 独立前端通过 milky-server 的 `/milky/api` 与 `/milky/event`（SSE/WS）直连（跨进程、需自管鉴权）。
- webui-gateway 自带的登录页 + WebUI 索引页 React 应用可直接参考或复用。
