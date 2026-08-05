// 日志条目数据模型。

export const LOG_LEVEL = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

export function createLogEntry(raw = {}) {
  return {
    time: raw.time ?? Date.now(),
    level: raw.level ?? LOG_LEVEL.info,
    module: raw.module ?? 'core',
    message: raw.message ?? '',
  }
}
