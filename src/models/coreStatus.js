// 核心状态数据模型：统一字段与默认值，对接真实接口时保持形状不变。

export const CORE_STATUS = {
  idle: 'idle',
  running: 'running',
  stopped: 'stopped',
  error: 'error',
}

export function createCoreStatus(raw = {}) {
  return {
    status: raw.status ?? CORE_STATUS.idle, // idle | running | stopped | error
    connected: raw.connected ?? false, // 事件连接是否在线
    baseUrl: raw.baseUrl ?? '',
    version: raw.version ?? '',
    startedAt: raw.startedAt ?? null, // 本次启动时间（毫秒时间戳）
    onlineSeconds: raw.onlineSeconds ?? 0,
  }
}
