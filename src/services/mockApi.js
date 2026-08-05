// 模拟数据服务：在没有真实后端时，让界面完整可操作。
// 状态保存在内存中，设置保存在 localStorage（仅演示用途）。

import { createCoreStatus, CORE_STATUS } from '../models/coreStatus.js'
import { createPlugin, PLUGIN_STATUS } from '../models/plugin.js'
import { createLogEntry, LOG_LEVEL } from '../models/logEntry.js'
import { DEFAULT_SETTINGS, normalizeSettings } from '../models/settings.js'

const SETTINGS_KEY = 'fraq-webui.settings'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const seedPlugins = () => [
  createPlugin({
    id: 'mock',
    name: 'mock',
    description: '模拟 Milky 协议端，方便本地调试',
    version: '0.5.2',
    status: PLUGIN_STATUS.running,
    enabled: true,
  }),
  createPlugin({
    id: 'hono',
    name: 'hono',
    description: 'HTTP 服务（Hono），为其他插件提供 Web 能力',
    version: '0.3.1',
    status: PLUGIN_STATUS.running,
    enabled: true,
  }),
  createPlugin({
    id: 'milky-server',
    name: 'milky-server',
    description: '代理 Milky API 与事件推送',
    version: '0.4.0',
    status: PLUGIN_STATUS.running,
    enabled: true,
  }),
  createPlugin({
    id: 'ai',
    name: 'ai',
    description: 'AI 对话能力（模型接入与工具调用）',
    version: '0.2.7',
    status: PLUGIN_STATUS.stopped,
    enabled: false,
  }),
  createPlugin({
    id: 'message-store',
    name: 'message-store',
    description: '消息持久化与检索',
    version: '0.1.9',
    status: PLUGIN_STATUS.error,
    enabled: true,
  }),
]

const LOG_MESSAGES = {
  debug: [
    (name) => `收到消息片段 3 条，解析耗时 ${2 + Math.floor(Math.random() * 8)}ms`,
    () => '路由匹配尝试 2 次',
  ],
  info: [
    (name) => `插件 ${name} 已启动`,
    () => 'WebSocket 事件连接已建立',
    (name) => `收到消息 seq=${1000 + Math.floor(Math.random() * 9000)}`,
    () => '指令 /help 执行完成',
  ],
  warn: [
    () => '事件连接断开，1 秒后重连',
    (name) => `插件 ${name} 响应缓慢（812ms）`,
  ],
  error: [
    () => '事件连接失败：连接超时',
    (name) => `插件 ${name} 抛出异常：数据库连接被拒绝`,
    () => 'API 调用 send_group_message 失败（retcode -500）',
  ],
}

function randomLevel() {
  const roll = Math.random()
  if (roll < 0.28) return LOG_LEVEL.debug
  if (roll < 0.72) return LOG_LEVEL.info
  if (roll < 0.88) return LOG_LEVEL.warn
  return LOG_LEVEL.error
}

function makeLogLine() {
  const level = randomLevel()
  const module = ['core', 'mock', 'hono', 'milky-server', 'ai', 'message-store'][
    Math.floor(Math.random() * 6)
  ]
  const templates = LOG_MESSAGES[level]
  const message = templates[Math.floor(Math.random() * templates.length)](module)
  return createLogEntry({ time: Date.now(), level, module, message })
}

const state = {
  core: createCoreStatus({
    status: CORE_STATUS.running,
    connected: true,
    baseUrl: 'http://127.0.0.1:4649',
    version: '1.3.0',
    startedAt: Date.now() - 6 * 3600 * 1000,
    onlineSeconds: 6 * 3600,
  }),
  plugins: seedPlugins(),
  logs: [],
  settings: normalizeSettings(loadSettings()),
  nextLogAt: Date.now() + 2000,
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}
  } catch {
    return {}
  }
}

function saveSettingsToStorage(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // 演示用途：localStorage 不可用时静默跳过
  }
}

function seedLogs() {
  // 预置一小段历史日志，让日志页第一次打开就有内容
  const now = Date.now()
  state.logs = [
    ['info', 'core', 'fraq-webui 已就绪'],
    ['info', 'hono', 'HTTP 服务已监听 127.0.0.1:4649'],
    ['info', 'mock', '模拟协议端已连接'],
    ['warn', 'ai', '模型接入配置为空，AI 功能未启用'],
    ['error', 'message-store', 'SQLite 打开失败：磁盘空间不足'],
    ['info', 'milky-server', 'Milky API 端点已注册'],
  ].map(([level, module, message], index) =>
    createLogEntry({ time: now - (5 - index) * 60000, level, module, message }),
  )
  state.nextLogAt = now + 2000
}

function tickLogs() {
  const now = Date.now()
  while (now >= state.nextLogAt) {
    state.logs.push(makeLogLine())
    state.nextLogAt += 2000 + Math.floor(Math.random() * 2500)
  }
  if (state.logs.length > 3000) {
    state.logs.splice(0, state.logs.length - 3000)
  }
}

seedLogs()

export const mockApi = {
  async getCoreStatus() {
    await sleep(120)
    if (state.core.status === CORE_STATUS.running) {
      state.core.onlineSeconds += 1
    }
    return createCoreStatus(state.core)
  },

  async getPlugins() {
    await sleep(160)
    return state.plugins.map((plugin) => createPlugin(plugin))
  },

  async getLogs({ limit = 100 } = {}) {
    tickLogs()
    await sleep(140)
    return state.logs.slice(-limit).map((entry) => createLogEntry(entry))
  },

  async getOlderLogs({ before = 0, count = 100 } = {}) {
    tickLogs()
    await sleep(180)
    const start = Math.max(0, before - count)
    return {
      entries: state.logs.slice(start, before).map((entry) => createLogEntry(entry)),
      hasMore: start > 0,
    }
  },

  async startCore() {
    await sleep(500)
    state.core.status = CORE_STATUS.running
    state.core.connected = true
    state.core.startedAt = Date.now()
    state.core.onlineSeconds = 0
    state.logs.push(createLogEntry({ level: LOG_LEVEL.info, module: 'core', message: '核心已启动' }))
  },

  async stopCore() {
    await sleep(500)
    state.core.status = CORE_STATUS.stopped
    state.core.connected = false
    state.core.onlineSeconds = 0
    state.logs.push(createLogEntry({ level: LOG_LEVEL.warn, module: 'core', message: '核心已停止' }))
  },

  async installPlugin({ name }) {
    await sleep(600)
    const id = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    if (state.plugins.some((plugin) => plugin.id === id)) {
      throw new Error(`插件 ${name} 已安装`)
    }
    const plugin = createPlugin({
      id,
      name: name.trim(),
      description: '新安装的插件，启动后开始生效',
      version: '0.1.0',
      status: PLUGIN_STATUS.stopped,
      enabled: false,
    })
    state.plugins.push(plugin)
    state.logs.push(
      createLogEntry({ level: LOG_LEVEL.info, module: 'core', message: `插件 ${name} 已安装，等待启动` }),
    )
  },

  async setPluginEnabled(id, enabled) {
    await sleep(400)
    const plugin = state.plugins.find((item) => item.id === id)
    if (!plugin) {
      throw new Error('插件不存在')
    }
    plugin.enabled = enabled
    plugin.status = enabled ? PLUGIN_STATUS.running : PLUGIN_STATUS.stopped
    state.logs.push(
      createLogEntry({
        level: enabled ? LOG_LEVEL.info : LOG_LEVEL.warn,
        module: plugin.name,
        message: enabled ? '插件已启动' : '插件已停用',
      }),
    )
  },

  async uninstallPlugin(id) {
    await sleep(500)
    const plugin = state.plugins.find((item) => item.id === id)
    if (!plugin) {
      throw new Error('插件不存在')
    }
    if (plugin.status === PLUGIN_STATUS.running) {
      throw new Error('请先停用插件再卸载')
    }
    state.plugins = state.plugins.filter((item) => item.id !== id)
    state.logs.push(
      createLogEntry({ level: LOG_LEVEL.info, module: 'core', message: `插件 ${plugin.name} 已卸载` }),
    )
  },

  async getSettings() {
    await sleep(120)
    return normalizeSettings(state.settings)
  },

  async saveSettings(settings) {
    await sleep(400)
    state.settings = normalizeSettings(settings)
    state.core.baseUrl = state.settings.baseUrl
    saveSettingsToStorage(state.settings)
    state.logs.push(createLogEntry({ level: LOG_LEVEL.info, module: 'core', message: '设置已保存' }))
  },

  async resetDemo() {
    await sleep(400)
    state.core = createCoreStatus({
      status: CORE_STATUS.running,
      connected: true,
      baseUrl: state.settings.baseUrl,
      version: '1.3.0',
      startedAt: Date.now() - 6 * 3600 * 1000,
      onlineSeconds: 6 * 3600,
    })
    state.plugins = seedPlugins()
    seedLogs()
  },
}

export { DEFAULT_SETTINGS }
