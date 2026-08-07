// 全局状态：所有页面共享的数据与操作。页面通过 store 读写，不直接碰服务层。

import { reactive } from 'vue'
import { api } from './api.js'
import { createCoreStatus } from '../models/coreStatus.js'
import { createPlugin } from '../models/plugin.js'
import { createLogEntry } from '../models/logEntry.js'
import { normalizeSettings } from '../models/settings.js'
import { createStorePlugin } from '../models/storePlugin.js'
import { createMessageStats } from '../models/messageStats.js'
import { normalizeAppearance } from '../models/appearance.js'
import { colorToRgba } from '../data/color.js'

const APPEARANCE_KEY = 'fraq-webui.appearance'

const state = reactive({
  core: createCoreStatus(),
  stats: createMessageStats(),
  appearance: normalizeAppearance(loadAppearance()),
  plugins: [],
  storePlugins: [],
  logs: [],
  settings: normalizeSettings(),
  loading: {
    core: true,
    stats: true,
    plugins: true,
    storePlugins: true,
    logs: true,
    settings: true,
  },
  loaded: {
    core: false,
    stats: false,
    plugins: false,
    storePlugins: false,
    logs: false,
    settings: false,
  },
  errors: {
    core: '',
    stats: '',
    plugins: '',
    storePlugins: '',
    logs: '',
    settings: '',
  },
  toasts: [],
  busyCore: false,
  busyPlugins: [],
})

let toastId = 0

function loadAppearance() {
  try {
    return JSON.parse(localStorage.getItem(APPEARANCE_KEY)) ?? {}
  } catch {
    return {}
  }
}

// 把外观设置应用到 CSS 变量（背景图 + 各区域颜色），并持久化
function applyAppearance() {
  const { appearance } = state
  const colors = appearance.colors
  const root = document.documentElement
  root.style.setProperty('--app-topbar-bg', colorToRgba(colors.topbar))
  root.style.setProperty('--app-sidebar-bg', colorToRgba(colors.sidebar))
  root.style.setProperty('--app-area-bg', colorToRgba(colors.area))
  root.style.setProperty('--app-component-bg', colorToRgba(colors.components))
  root.style.setProperty('--app-topbar-blur', `${colors.topbar.blur}px`)
  root.style.setProperty('--app-sidebar-blur', `${colors.sidebar.blur}px`)
  root.style.setProperty('--app-area-blur', `${colors.area.blur}px`)
  root.style.setProperty('--app-component-blur', `${colors.components.blur}px`)

  let image = "url('/bg.jpg')"
  const { background } = appearance
  if (background.mode === 'url' && background.value.trim()) {
    image = `url('${background.value.trim()}')`
  } else if (background.mode === 'file' && background.value) {
    image = `url('${background.value}')`
  }
  root.style.setProperty('--app-bg-image', image)
}

function setAppearance(next) {
  state.appearance = normalizeAppearance(next)
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(state.appearance))
  } catch {
    // 存储不可用时仅本次生效
  }
  applyAppearance()
}

function toast(type, message) {
  const id = ++toastId
  state.toasts.push({ id, type, message })
  setTimeout(() => dismissToast(id), 4500)
}

function dismissToast(id) {
  const index = state.toasts.findIndex((item) => item.id === id)
  if (index !== -1) {
    state.toasts.splice(index, 1)
  }
}

async function refreshCore() {
  // 只在首次加载时显示骨架屏；后台轮询刷新保持内容稳定，避免页面抖动
  if (!state.loaded.core) state.loading.core = true
  try {
    state.core = createCoreStatus(await api.getCoreStatus())
    state.errors.core = ''
    state.loaded.core = true
  } catch (error) {
    state.errors.core = error instanceof Error ? error.message : '无法读取核心状态'
  } finally {
    state.loading.core = false
  }
}

async function refreshStats() {
  if (!state.loaded.stats) state.loading.stats = true
  try {
    state.stats = createMessageStats(await api.getStats())
    state.errors.stats = ''
    state.loaded.stats = true
  } catch (error) {
    state.errors.stats = error instanceof Error ? error.message : '无法读取消息统计'
  } finally {
    state.loading.stats = false
  }
}

// SSE 实时推送的统计更新入口
function setStats(stats) {
  state.stats = createMessageStats(stats)
  state.errors.stats = ''
  state.loaded.stats = true
  state.loading.stats = false
}

async function refreshPlugins() {
  if (!state.loaded.plugins) state.loading.plugins = true
  try {
    state.plugins = (await api.getPlugins()).map((plugin) => createPlugin(plugin))
    state.errors.plugins = ''
    state.loaded.plugins = true
  } catch (error) {
    state.errors.plugins = error instanceof Error ? error.message : '无法读取插件列表'
  } finally {
    state.loading.plugins = false
  }
}

async function refreshStorePlugins() {
  if (!state.loaded.storePlugins) state.loading.storePlugins = true
  try {
    state.storePlugins = (await api.getStorePlugins()).map((plugin) => createStorePlugin(plugin))
    state.errors.storePlugins = ''
    state.loaded.storePlugins = true
  } catch (error) {
    state.errors.storePlugins = error instanceof Error ? error.message : '无法读取插件商店'
  } finally {
    state.loading.storePlugins = false
  }
}

async function refreshLogs() {
  try {
    state.logs = (await api.getLogs()).map((entry) => createLogEntry(entry))
    state.errors.logs = ''
    state.loaded.logs = true
  } catch (error) {
    state.errors.logs = error instanceof Error ? error.message : '无法读取日志'
  } finally {
    state.loading.logs = false
  }
}

async function refreshSettings() {
  if (!state.loaded.settings) state.loading.settings = true
  try {
    state.settings = normalizeSettings(await api.getSettings())
    state.errors.settings = ''
    state.loaded.settings = true
  } catch (error) {
    state.errors.settings = error instanceof Error ? error.message : '无法读取设置'
  } finally {
    state.loading.settings = false
  }
}

async function loadOlderLogs(beforeCount) {
  const { entries, hasMore } = await api.getOlderLogs({ before: beforeCount, count: 100 })
  state.logs = [...entries.map((entry) => createLogEntry(entry)), ...state.logs]
  return hasMore
}

async function startCore() {
  if (state.busyCore) return
  state.busyCore = true
  try {
    await api.startCore()
    toast('success', '核心已启动')
    await refreshCore()
  } catch (error) {
    toast('error', error instanceof Error ? error.message : '启动失败')
  } finally {
    state.busyCore = false
  }
}

async function stopCore() {
  if (state.busyCore) return
  state.busyCore = true
  try {
    await api.stopCore()
    toast('info', '核心已停止')
    await refreshCore()
  } catch (error) {
    toast('error', error instanceof Error ? error.message : '停止失败')
  } finally {
    state.busyCore = false
  }
}

async function installPlugin(name) {
  await api.installPlugin({ name })
  toast('success', `插件 ${name} 已安装`)
  await refreshPlugins()
}

async function setPluginEnabled(id, enabled) {
  if (state.busyPlugins.includes(id)) return
  state.busyPlugins.push(id)
  try {
    await api.setPluginEnabled(id, enabled)
    toast('success', enabled ? '插件已启动' : '插件已停用')
    await refreshPlugins()
  } catch (error) {
    toast('error', error instanceof Error ? error.message : '操作失败')
  } finally {
    const index = state.busyPlugins.indexOf(id)
    if (index !== -1) state.busyPlugins.splice(index, 1)
  }
}

async function uninstallPlugin(id) {
  if (state.busyPlugins.includes(id)) return
  state.busyPlugins.push(id)
  try {
    await api.uninstallPlugin(id)
    toast('success', '插件已卸载')
    await refreshPlugins()
  } catch (error) {
    toast('error', error instanceof Error ? error.message : '卸载失败')
  } finally {
    const index = state.busyPlugins.indexOf(id)
    if (index !== -1) state.busyPlugins.splice(index, 1)
  }
}

async function saveSettings(settings) {
  await api.saveSettings(settings)
  state.settings = normalizeSettings(await api.getSettings())
  toast('success', '设置已保存')
}

export const store = {
  state,
  refreshCore,
  refreshStats,
  setStats,
  setAppearance,
  refreshPlugins,
  refreshStorePlugins,
  refreshLogs,
  refreshSettings,
  loadOlderLogs,
  startCore,
  stopCore,
  installPlugin,
  setPluginEnabled,
  uninstallPlugin,
  saveSettings,
  toast,
  dismissToast,
}

// 模块加载时应用已保存的外观
applyAppearance()
