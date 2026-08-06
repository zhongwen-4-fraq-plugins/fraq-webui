// 真实数据传输层：与配套管理服务（server/）通信。
// 开发时由 Vite 代理 /api 到 http://127.0.0.1:8787；生产时由服务端同源托管。

import { PLUGIN_REGISTRY_URL } from '../core/config.js'

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    let message = `请求失败（HTTP ${response.status}）`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // 保留默认错误信息
    }
    throw new Error(message)
  }
  return response.json()
}

export const httpApi = {
  async getCoreStatus() {
    return request('/api/core')
  },

  async getPlugins() {
    return request('/api/plugins')
  },

  async getStorePlugins() {
    const response = await fetch(PLUGIN_REGISTRY_URL)
    if (!response.ok) {
      throw new Error('无法连接插件商店，请检查网络后重试')
    }
    const data = await response.json()
    return Object.entries(data.plugins ?? {})
      .filter(([, plugin]) => plugin?.market?.unlisted !== true)
      .map(([id, plugin]) => ({ id, ...plugin }))
  },

  async getLogs({ limit = 100 } = {}) {
    return request(`/api/logs?limit=${limit}`)
  },

  async getOlderLogs({ before = 0, count = 100 } = {}) {
    return request(`/api/logs/older?before=${before}&count=${count}`)
  },

  async startCore() {
    return request('/api/core/start', { method: 'POST' })
  },

  async stopCore() {
    return request('/api/core/stop', { method: 'POST' })
  },

  async installPlugin({ name }) {
    return request('/api/plugins/install', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  async setPluginEnabled(id, enabled) {
    return request(`/api/plugins/${encodeURIComponent(id)}/${enabled ? 'enable' : 'disable'}`, {
      method: 'POST',
    })
  },

  async uninstallPlugin(id) {
    return request(`/api/plugins/${encodeURIComponent(id)}/uninstall`, { method: 'POST' })
  },

  async getSettings() {
    return request('/api/settings')
  },

  async saveSettings({ baseUrl, accessToken }) {
    return request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ baseUrl, accessToken }),
    })
  },
}
