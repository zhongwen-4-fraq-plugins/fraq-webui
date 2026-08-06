// 日志条目数据模型：与前端 models/logEntry.js 保持一致。

export function logEntry({ time = Date.now(), level = 'info', module = 'core', message }) {
  return {
    time,
    level,
    module,
    message,
  }
}
