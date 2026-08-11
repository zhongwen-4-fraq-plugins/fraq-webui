// Hono 应用：API 路由 + 日志 SSE + 静态界面托管。

import fs from 'node:fs'
import path from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { upgradeWebSocket } from '@hono/node-server'
import { streamSSE } from 'hono/streaming'
import { parse } from 'yaml'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import {
  DIST_DIR,
  ADMIN_TOKEN,
  MILKY_URL,
  MILKY_WS_URL,
  MILKY_ACCESS_TOKEN,
  SESSION_TTL_MS,
  getAppDir,
  setAppDir,
  saveState,
} from './config.js'
import * as logService from '../services/logService.js'
import * as processManager from '../services/processManager.js'
import * as fraqConfig from '../services/fraqConfig.js'
import * as messageStats from '../services/messageStats.js'
import * as auth from '../services/auth.js'
import * as environment from '../services/environment.js'
import { resolveInstallPlan } from '../services/pluginRegistry.js'
import { coreStatus } from '../models/status.js'

export const app = new Hono()

const COOKIE_NAME = 'fraq_webui_session'

// 登录校验：未登录的 /api 请求返回 401（health 与 auth 路由除外）
app.use('/api/*', async (c, next) => {
  const path = c.req.path
  if (path === '/api/health' || path.startsWith('/api/auth/')) {
    return next()
  }
  const sid = getCookie(c, COOKIE_NAME)
  if (auth.isValidSession(sid)) {
    return next()
  }
  if (ADMIN_TOKEN && c.req.header('Authorization') === `Bearer ${ADMIN_TOKEN}`) {
    return next()
  }
  return c.json({ error: 'Unauthorized' }, 401)
})

app.get('/api/auth/me', (c) => {
  const sid = getCookie(c, COOKIE_NAME)
  return c.json({ authenticated: auth.isValidSession(sid) })
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!auth.verifyLoginToken(body.token)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const sid = auth.createSession()
  setCookie(c, COOKIE_NAME, sid, {
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: '/',
  })
  return c.json({ ok: true })
})

app.post('/api/auth/logout', (c) => {
  const sid = getCookie(c, COOKIE_NAME)
  if (sid) {
    auth.destroySession(sid)
  }
  deleteCookie(c, COOKIE_NAME, { path: '/' })
  return c.json({ ok: true })
})

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/core', (c) => {
  const info = processManager.getProcessInfo()
  const settings = fraqConfig.getSettings()
  const doc = safeReadConfig()
  return c.json(
    coreStatus({
      running: info.running,
      pid: info.pid,
      startedAt: info.startedAt,
      baseUrl: settings.baseUrl,
      version: doc?.fraqVersion ?? '',
    }),
  )
})

app.get('/api/stats', (c) => c.json(messageStats.getStats()))

app.get('/api/stats/stream', (c) =>
  streamSSE(c, async (stream) => {
    const send = (stats) => stream.writeSSE({ data: JSON.stringify(stats) }).catch(unsubscribe)
    const unsubscribe = messageStats.subscribe(send)
    await new Promise((resolve) => {
      stream.onAbort(() => {
        unsubscribe()
        resolve()
      })
    })
  }),
)

app.post('/api/core/start', async (c) => {
  try {
    await processManager.start()
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : '启动失败' }, 409)
  }
})

app.post('/api/core/stop', async (c) => {
  await processManager.stop()
  return c.json({ ok: true })
})

app.get('/api/plugins', (c) => c.json(fraqConfig.getPlugins(processManager.isRunning())))

app.post('/api/plugins/install', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9-]*$/i.test(name)) {
    return c.json({ error: '插件名称格式不正确，例如 @fraqjs/plugin-hono' }, 400)
  }
  let plan
  try {
    plan = await resolveInstallPlan(name, typeof body.version === 'string' ? body.version : undefined)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : '无法解析插件信息' }, 400)
  }
  fraqConfig.addPlugins(plan)
  // 进程未运行时手动安装依赖，让新插件立即可用
  if (!processManager.isRunning()) {
    await processManager.installDependencies()
  }
  return c.json({ ok: true, plugins: plan.map((item) => item.key) })
})

app.post('/api/plugins/:id/enable', (c) => {
  fraqConfig.setPluginEnabled(c.req.param('id'), true)
  return c.json({ ok: true })
})

app.post('/api/plugins/:id/disable', (c) => {
  fraqConfig.setPluginEnabled(c.req.param('id'), false)
  return c.json({ ok: true })
})

app.post('/api/plugins/:id/uninstall', (c) => {
  fraqConfig.uninstallPlugin(c.req.param('id'))
  return c.json({ ok: true })
})

app.get('/api/logs', (c) => {
  const limit = Number(c.req.query('limit') ?? 200)
  return c.json(logService.list(Number.isFinite(limit) ? limit : 200))
})

app.get('/api/logs/older', (c) => {
  const before = Number(c.req.query('before') ?? 0)
  const count = Number(c.req.query('count') ?? 100)
  return c.json(logService.older(before, count))
})

app.get('/api/logs/stream', (c) => {
  return streamSSE(c, async (stream) => {
    const send = (entry) => stream.writeSSE({ data: JSON.stringify(entry) }).catch(unsubscribe)
    const unsubscribe = logService.subscribe(send)
    await new Promise((resolve) => {
      stream.onAbort(() => {
        unsubscribe()
        resolve()
      })
    })
  })
})

app.get('/api/settings', (c) => c.json(fraqConfig.getSettings()))

app.put('/api/settings', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const baseUrl = typeof body.baseUrl === 'string' ? body.baseUrl.trim() : ''
  try {
    const url = new URL(baseUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('bad protocol')
    }
  } catch {
    return c.json({ error: '服务地址格式不正确，例如 http://127.0.0.1:30001' }, 400)
  }
  if (typeof body.appDir === 'string' && body.appDir.trim()) {
    const dir = path.resolve(body.appDir.trim())
    try {
      if (!fs.statSync(dir).isDirectory()) {
        throw new Error('not a directory')
      }
      if (!fs.existsSync(path.join(dir, 'fraq.yml'))) {
        return c.json({ error: '该目录中没有 fraq.yml' }, 400)
      }
    } catch {
      return c.json({ error: '项目目录不存在或不可访问' }, 400)
    }
    setAppDir(dir)
    saveState()
  }
  fraqConfig.saveSettings({
    baseUrl,
    accessToken: typeof body.accessToken === 'string' ? body.accessToken : '',
  })
  return c.json({ ok: true })
})

// 安装：环境检查 + 安装 fraq CLI 与 Milky 协议端
app.get('/api/install/check', async (c) => c.json(await environment.checkAll()))

app.post('/api/install/cli', (c) => {
  try {
    environment.installCli()
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : '安装失败' }, 409)
  }
})

app.get('/api/install/releases', async (c) => {
  try {
    const releases = await environment.listReleases(c.req.query('source'))
    return c.json({ releases })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : '无法获取版本列表' }, 400)
  }
})

app.get('/api/install/status', (c) => c.json(environment.getStatus()))

app.post('/api/install/protocol', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  try {
    environment.installProtocol({
      source: body.source,
      tag: body.tag,
      assetName: body.asset,
    })
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : '安装失败' }, 409)
  }
})

app.post('/api/install/protocol/start', (c) => {
  try {
    return c.json(environment.startProtocol())
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : '启动失败' }, 409)
  }
})

app.post('/api/install/protocol/stop', async (c) => {
  await environment.stopProtocol()
  return c.json({ ok: true })
})

// milky 协议代理：fraq 的 milky.url 指向本服务，
// 转发发送类 API 时计数“发出”，转发事件流时计数“收到”。
const SEND_ENDPOINTS = new Set(['send_private_message', 'send_group_message'])

app.post('/api/:endpoint', async (c) => {
  const endpoint = c.req.param('endpoint')
  const body = await c.req.text()
  const headers = { 'Content-Type': 'application/json' }
  if (MILKY_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${MILKY_ACCESS_TOKEN}`
  }
  try {
    const response = await fetch(`${MILKY_URL}/api/${endpoint}`, {
      method: 'POST',
      headers,
      body,
    })
    if (SEND_ENDPOINTS.has(endpoint)) {
      messageStats.bumpSent()
    }
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return c.json(
      {
        status: 'failed',
        retcode: -502,
        message: `无法连接 Milky 协议端：${error instanceof Error ? error.message : String(error)}`,
      },
      502,
    )
  }
})

app.get(
  '/event',
  upgradeWebSocket(() => {
    let target = null
    return {
      onOpen(_event, ws) {
        const url = new URL(`${MILKY_WS_URL}/event`)
        if (MILKY_ACCESS_TOKEN) {
          url.searchParams.set('access_token', MILKY_ACCESS_TOKEN)
        }
        target = new WebSocket(url)
        target.onmessage = (event) => {
          try {
            const data = JSON.parse(String(event.data))
            if (data?.event_type === 'message_receive') {
              messageStats.bumpReceived()
            }
          } catch {
            // 非 JSON 帧直接转发，不影响计数
          }
          ws.send(String(event.data))
        }
        target.onclose = () => ws.close()
        target.onerror = () => target?.close()
      },
      onMessage(event, ws) {
        target?.send(String(event.data))
      },
      onClose() {
        target?.close()
      },
    }
  }),
)

// 静态界面：构建产物存在时托管 dist/，未知路径回退到 index.html
if (fs.existsSync(DIST_DIR)) {
  app.use('/*', async (c, next) => {
    // index.html 不缓存，避免前端更新后浏览器仍用旧页面
    if (!c.req.path.startsWith('/api') && !/\.[a-z0-9]+$/i.test(c.req.path)) {
      c.header('Cache-Control', 'no-cache')
    }
    await next()
  })
  app.use(
    '/*',
    serveStatic({
      root: DIST_DIR,
      rewriteRequestPath: (p) => p,
    }),
  )
  app.get('*', async (c, next) => {
    if (c.req.path.startsWith('/api')) {
      return next()
    }
    const indexHtml = path.join(DIST_DIR, 'index.html')
    return fs.existsSync(indexHtml)
      ? new Response(fs.readFileSync(indexHtml), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        })
      : next()
  })
}

app.notFound((c) => {
  if (c.req.path.startsWith('/api')) {
    return c.json({ error: 'Not Found' }, 404)
  }
  return c.text('fraq-webui 服务运行中', 404)
})

function safeReadConfig() {
  try {
    return parse(fs.readFileSync(path.join(getAppDir(), 'fraq.yml'), 'utf8'))
  } catch {
    return null
  }
}
