// 服务端配置：端口、fraq 项目路径、可选访问令牌。

import path from 'node:path'
import fs from 'node:fs'

export const HOST = process.env.FRAQ_WEBUI_HOST ?? '127.0.0.1'
export const PORT = Number(process.env.FRAQ_WEBUI_PORT ?? 8787)

// fraq 项目目录（包含 fraq.yml）。优先级：环境变量 > 设置里保存的路径 > 默认值。
// 环境变量：FRAQ_WEBUI_APP_DIR=D:\path\to\fraq-app node server/index.js
const DEFAULT_APP_DIR = 'D:/bot/fraq-plugins/my-fraq-app'
const STATE_FILE = path.resolve('.fraq-webui-state.json')

let appDir = path.resolve(process.env.FRAQ_WEBUI_APP_DIR ?? loadSavedAppDir() ?? DEFAULT_APP_DIR)

export function getAppDir() {
  return appDir
}

export function setAppDir(dir) {
  appDir = path.resolve(dir)
}

export function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ appDir }))
  } catch {
    // 状态文件写入失败时仅本次生效
  }
}

function loadSavedAppDir() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
    return typeof state?.appDir === 'string' && state.appDir ? state.appDir : null
  } catch {
    return null
  }
}

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
