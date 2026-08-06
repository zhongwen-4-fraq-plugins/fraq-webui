// 日志服务：保存最近的日志行，并向 SSE 订阅者实时推送。

import { logEntry } from '../models/log.js'
import { classifyLevel, parseLine, splitLines } from '../data/logs.js'
import { MAX_LOG_LINES } from '../core/config.js'

const buffer = []
const subscribers = new Set()

function pushEntry(entry) {
  buffer.push(entry)
  if (buffer.length > MAX_LOG_LINES) {
    buffer.splice(0, buffer.length - MAX_LOG_LINES)
  }
  for (const send of subscribers) {
    send(entry)
  }
}

export function push(text) {
  for (const line of splitLines(text)) {
    const { time, level, module, message } = parseLine(line)
    pushEntry(
      logEntry({
        time: time ?? Date.now(),
        level: level ?? classifyLevel(line),
        module,
        message,
      }),
    )
  }
}

export function pushEvent(level, message) {
  pushEntry(logEntry({ level, module: 'fraq-webui', message }))
}

export function list(limit = 200) {
  return buffer.slice(-limit)
}

export function older(before, count = 100) {
  const start = Math.max(0, before - count)
  return {
    entries: buffer.slice(start, before),
    hasMore: start > 0,
  }
}

export function subscribe(send) {
  subscribers.add(send)
  return () => subscribers.delete(send)
}

pushEvent('info', 'fraq-webui 管理服务已就绪')
