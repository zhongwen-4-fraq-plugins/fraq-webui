// 日志条目数据模型：与前端 models/logEntry.js 保持一致。

export function logEntry({ level = 'info', module = 'core', message }) {
  return {
    time: Date.now(),
    level,
    module,
    message,
  }
}
