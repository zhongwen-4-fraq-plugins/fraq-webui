// 日志的处理逻辑：级别元数据、过滤、统计、时间标签。

export const LOG_LEVEL_META = {
  debug: { label: '调试', tone: 'info' },
  info: { label: '信息', tone: 'info' },
  warn: { label: '警告', tone: 'warning' },
  error: { label: '错误', tone: 'danger' },
}

export function levelLabel(level) {
  return LOG_LEVEL_META[level]?.label ?? level
}

export function filterLogs(entries, { level = 'all', query = '' } = {}) {
  const q = query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (level !== 'all' && entry.level !== level) return false
    if (q && !`${entry.module} ${entry.message}`.toLowerCase().includes(q)) return false
    return true
  })
}

export function logTimeLabel(timestamp, now = Date.now()) {
  const d = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, '0')
  const hms = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  const sameDay = d.toDateString() === new Date(now).toDateString()
  return sameDay ? hms : `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hms}`
}
