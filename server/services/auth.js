// 登录鉴权：令牌校验 + 服务端会话。

import crypto from 'node:crypto'
import { ADMIN_TOKEN, SESSION_TTL_MS } from '../core/config.js'
import * as logService from './logService.js'

const sessions = new Map() // sid -> expiresAt

// 登录令牌：优先取环境变量；未设置时自动生成，并在日志/终端打印
export const LOGIN_TOKEN = ADMIN_TOKEN || crypto.randomBytes(16).toString('hex')

if (!ADMIN_TOKEN) {
  logService.pushEvent('info', `登录令牌：${LOGIN_TOKEN}（设置 FRAQ_WEBUI_TOKEN 可固定）`)
}

export function verifyLoginToken(candidate) {
  const actual = Buffer.from(String(candidate ?? ''))
  const expected = Buffer.from(LOGIN_TOKEN)
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

export function createSession() {
  const sid = crypto.randomBytes(24).toString('hex')
  sessions.set(sid, Date.now() + SESSION_TTL_MS)
  return sid
}

export function isValidSession(sid) {
  if (!sid || !sessions.has(sid)) {
    return false
  }
  const expiresAt = sessions.get(sid)
  if (Date.now() > expiresAt) {
    sessions.delete(sid)
    return false
  }
  return true
}

export function destroySession(sid) {
  sessions.delete(sid)
}
