// 服务端配置：端口、fraq 项目路径、可选访问令牌。

import path from 'node:path'
import fs from 'node:fs'

export const HOST = process.env.FRAQ_WEBUI_HOST ?? '127.0.0.1'
export const PORT = Number(process.env.FRAQ_WEBUI_PORT ?? 8787)

// fraq 项目目录（包含 fraq.yml）。优先级：环境变量 > 设置里保存的路径 > 默认值。
// 环境变量：FRAQ_WEBUI_APP_DIR=D:\path\to\fraq-app node server/index.js
const DEFAULT_APP_DIR = 'D:/bot/fraq-plugins/my-fraq-app'
const STATE_FILE = path.resolve('.fraq-webui-state.json')

const savedState = loadSavedState()

let appDir = path.resolve(process.env.FRAQ_WEBUI_APP_DIR ?? savedState.appDir ?? DEFAULT_APP_DIR)

// 协议端安装目录（下载并解压 Yogurt / LuckyLilliaBot 的位置）
let protocolDir = path.resolve(
  process.env.FRAQ_WEBUI_PROTOCOL_DIR ?? savedState.protocolDir ?? 'protocols',
)

// 便携版 Node.js 目录（安装页下载的 Node zip 解压位置，空表示未安装）
let portableNodeDir = process.env.FRAQ_WEBUI_NODE_DIR ?? savedState.nodeDir ?? ''

export function getAppDir() {
  return appDir
}

export function setAppDir(dir) {
  appDir = path.resolve(dir)
}

export function getProtocolDir() {
  return protocolDir
}

export function setProtocolDir(dir) {
  protocolDir = path.resolve(dir)
}

export function getPortableNodeDir() {
  return portableNodeDir
}

export function setPortableNodeDir(dir) {
  portableNodeDir = path.resolve(dir)
}

export function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ appDir, protocolDir, nodeDir: portableNodeDir }))
  } catch {
    // 状态文件写入失败时仅本次生效
  }
}

function loadSavedState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) ?? {}
  } catch {
    return {}
  }
}

// 可选：设置后所有 /api 请求都需要 Authorization: Bearer <token>
export const ADMIN_TOKEN = process.env.FRAQ_WEBUI_TOKEN ?? ''
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

// 真实 Milky 协议端地址（fraq 的 milky.url 指向本服务，由本服务转发到这里）
export const MILKY_URL = process.env.FRAQ_WEBUI_MILKY_URL ?? 'http://localhost:30001'
export const MILKY_WS_URL = MILKY_URL.replace(/^http/, 'ws')
export const MILKY_ACCESS_TOKEN = process.env.FRAQ_WEBUI_MILKY_TOKEN ?? ''

// 前端构建产物目录（server 同时托管静态界面）
export const DIST_DIR = path.resolve('dist')

// 日志缓冲上限
export const MAX_LOG_LINES = 2000
