// 插件数据模型。

export const PLUGIN_STATUS = {
  running: 'running',
  stopped: 'stopped',
  error: 'error',
}

export function createPlugin(raw = {}) {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    version: raw.version ?? '0.0.0',
    status: raw.status ?? PLUGIN_STATUS.stopped,
    enabled: raw.enabled ?? false,
  }
}
