# fraq-webui

fraq 的轻量 Web 管理界面：核心启停、插件管理、日志与状态。前端 Vue 3 + Vite，配套管理服务 Node + Hono。

## 前置要求

- Node.js 22+
- fraq CLI（建议最新版）：

  ```bash
  npm install -g @fraqjs/cli@latest
  ```

- 一个 fraq 项目目录（含 `fraq.yml`），例如 `D:\bot\fraq-plugins\my-fraq-app`

## 启动

```bash
npm install
npm run build        # 构建前端到 dist/
npm run server       # 启动管理服务（默认 http://127.0.0.1:8787）
```

打开 http://127.0.0.1:8787 即可使用。服务端会负责拉起 `fraq start`、收集日志、读写 `fraq.yml`（插件启停、Milky 连接设置）。

## 开发模式

```bash
npm run server       # 先起管理服务
npm run dev          # Vite 开发服务器（/api 自动代理到 8787）
```

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `FRAQ_WEBUI_HOST` | `127.0.0.1` | 服务监听地址 |
| `FRAQ_WEBUI_PORT` | `8787` | 服务端口 |
| `FRAQ_WEBUI_APP_DIR` | `D:/bot/fraq-plugins/my-fraq-app` | fraq 项目目录 |
| `FRAQ_WEBUI_TOKEN` | 空 | 设置后所有 /api 请求需带 `Authorization: Bearer <token>` |

## 说明

- 插件列表、版本、核心状态、日志均来自真实 fraq 实例；插件启停与 Milky 设置直接写 `fraq.yml`，fraq CLI 会自动重启生效。
- `fraq.yml` 中可能包含 API Key 等密钥，服务端**不会**回传插件配置内容；设置接口也只会返回令牌是否已配置，不返回令牌明文。
- 当前插件状态以进程是否运行为准（无法从外部区分单个插件的运行状态）。
