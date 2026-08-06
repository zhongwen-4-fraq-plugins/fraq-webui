// Hono 应用：API 路由 + 日志 SSE + 静态界面托管。

import fs from 'node:fs'
import path from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { upgradeWebSocket } from '@hono/node-server'
import { streamSSE } from 'hono/streaming'
import { parse } from 'yaml'
import { DIST_DIR, CONFIG_PATH, ADMIN_TOKEN, MILKY_URL, MILKY_WS_URL, MILKY_ACCESS_TOKEN } from './config.js'
import * as logService from '../services/logService.js'
import * as processManager from '../services/processManager.js'
import * as fraqConfig from '../services/fraqConfig.js'
import * as messageStats from '../services/messageStats.js'
import { coreStatus } from '../models/status.js'

export const app = new Hono()

// 可选令牌校验：设置了 FRAQ_WEBUI_TOKEN 后，所有 /api 请求都需带 Bearer 令牌
app.use('/api/*', async (c, next) => {
  if (ADMIN_TOKEN && c.req.header('Authorization') !== `Bearer ${ADMIN_TOKEN}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
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
  fraqConfig.installPlugin(name)
  // 进程未运行时手动安装依赖，让新插件立即可用
  if (!processManager.isRunning()) {
    await processManager.installDependencies()
  }
  return c.json({ ok: true })
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
  fraqConfig.saveSettings({
    baseUrl,
    accessToken: typeof body.accessToken === 'string' ? body.accessToken : '',
  })
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
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
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
    return parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    return null
  }
}
