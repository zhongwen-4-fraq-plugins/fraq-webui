// 日志行的处理：去 ANSI 颜色码、识别级别与模块。

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

export function splitLines(text) {
  return stripAnsi(text)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
}

export function parseLine(line) {
  const match = line.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    return { module: match[1], message: match[2] || line }
  }
  return { module: 'app', message: line }
}
