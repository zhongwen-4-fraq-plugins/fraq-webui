// fraq-webui 管理服务入口：
//   node server/index.js
// 默认监听 http://127.0.0.1:8787，同时托管前端构建产物（dist/）。

import { serve } from '@hono/node-server'
import { app } from './core/app.js'
import { HOST, PORT, APP_DIR } from './core/config.js'
import * as processManager from './services/processManager.js'
import * as logService from './services/logService.js'

const server = serve(
  {
    fetch: app.fetch,
    hostname: HOST,
    port: PORT,
  },
  (info) => {
    logService.pushEvent(
      'info',
      `fraq-webui 服务已启动：http://${HOST}:${info.port}（fraq 项目：${APP_DIR}）`,
    )
    console.log(`fraq-webui: http://${HOST}:${info.port}`)
  },
)

async function shutdown() {
  logService.pushEvent('info', '正在关闭 fraq-webui 服务...')
  await processManager.stop()
  server.close()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
