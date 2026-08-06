// 服务端配置：端口、fraq 项目路径、可选访问令牌。

import path from 'node:path'

export const HOST = process.env.FRAQ_WEBUI_HOST ?? '127.0.0.1'
export const PORT = Number(process.env.FRAQ_WEBUI_PORT ?? 8787)

// fraq 项目目录（包含 fraq.yml）。可在启动时用环境变量覆盖：
//   FRAQ_WEBUI_APP_DIR=D:\path\to\fraq-app node server/index.js
export const APP_DIR = path.resolve(process.env.FRAQ_WEBUI_APP_DIR ?? 'D:/bot/fraq-plugins/my-fraq-app')

export const CONFIG_PATH = path.join(APP_DIR, 'fraq.yml')
export const VERSIONS_PATH = path.join(APP_DIR, 'versions.yml')

// 可选：设置后所有 /api 请求都需要 Authorization: Bearer <token>
export const ADMIN_TOKEN = process.env.FRAQ_WEBUI_TOKEN ?? ''

// 真实 Milky 协议端地址（fraq 的 milky.url 指向本服务，由本服务转发到这里）
export const MILKY_URL = process.env.FRAQ_WEBUI_MILKY_URL ?? 'http://localhost:30001'
export const MILKY_WS_URL = MILKY_URL.replace(/^http/, 'ws')
export const MILKY_ACCESS_TOKEN = process.env.FRAQ_WEBUI_MILKY_TOKEN ?? ''

// 前端构建产物目录（server 同时托管静态界面）
export const DIST_DIR = path.resolve('dist')

// 日志缓冲上限
export const MAX_LOG_LINES = 2000
