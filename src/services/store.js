// 全局状态：所有页面共享的数据与操作。页面通过 store 读写，不直接碰服务层。

import { reactive } from 'vue'
import { api } from './api.js'
import { createCoreStatus } from '../models/coreStatus.js'
import { createPlugin } from '../models/plugin.js'
import { createLogEntry } from '../models/logEntry.js'
import { normalizeSettings } from '../models/settings.js'

const state = reactive({
  core: createCoreStatus(),
  plugins: [],
  logs: [],
  settings: normalizeSettings(),
  loading: {
    core: true,
    plugins: true,
    logs: true,
    settings: true,
  },
  loaded: {
    core: false,
    plugins: false,
    logs: false,
    settings: false,
  },
  errors: {
    core: '',
    plugins: '',
    logs: '',
    settings: '',
  },
  toasts: [],
  busyCore: false,
  busyPlugins: [],
})

let toastId = 0

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

async function resetDemo() {
  await api.resetDemo()
  toast('success', '演示数据已重置')
  await Promise.all([refreshCore(), refreshPlugins(), refreshLogs(), refreshSettings()])
}

export const store = {
  state,
  refreshCore,
  refreshPlugins,
  refreshLogs,
  refreshSettings,
  loadOlderLogs,
  startCore,
  stopCore,
  installPlugin,
  setPluginEnabled,
  uninstallPlugin,
  saveSettings,
  resetDemo,
  toast,
  dismissToast,
}
