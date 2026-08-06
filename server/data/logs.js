// 日志行的处理：去 ANSI 颜色码、提取 fraq 日志行里的时间/级别/模块。

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g

export function stripAnsi(text) {
  return text.replace(ANSI_PATTERN, '')
}

export function classifyLevel(text) {
  if (/error|failed|exception|traceback/i.test(text)) return 'error'
  if (/warn/i.test(text)) return 'warn'
  if (/debug/i.test(text)) return 'debug'
  return 'info'
}

// fraq 日志行格式：2026/08/07 05:46:48  INFO context:root message...
const FRAQ_LINE_PATTERN = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\s+(DEBUG|INFO|WARN|ERROR)\s+(\S+)\s+(.*)$/

function parseFraqTimestamp(dateTime) {
  const [datePart, timePart] = dateTime.split(' ')
  const [year, month, day] = datePart.split('/').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, second).getTime()
}

export function splitLines(text) {
  return stripAnsi(text)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
}

export function parseLine(line) {
  const fraqMatch = line.match(FRAQ_LINE_PATTERN)
  if (fraqMatch) {
    const [, dateTime, rawLevel, module, message] = fraqMatch
    return {
      time: parseFraqTimestamp(dateTime),
      level: rawLevel.toLowerCase(),
      module,
      message,
    }
  }
  const match = line.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    return { time: null, level: null, module: match[1], message: match[2] || line }
  }
  return { time: null, level: null, module: 'app', message: line }
}
