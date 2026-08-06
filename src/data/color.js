// 颜色处理：ARGB 与 rgba 的转换。

export function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    return { r: 255, g: 255, b: 255 }
  }
  const int = parseInt(full, 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

export function toHex(value) {
  return value.toString(16).padStart(2, '0').toUpperCase()
}

export function colorToRgba({ color = '#ffffff', alpha = 1 } = {}) {
  const { r, g, b } = hexToRgb(color)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function colorToArgb({ color = '#ffffff', alpha = 1 } = {}) {
  const { r, g, b } = hexToRgb(color)
  const a = toHex(Math.round(Math.min(1, Math.max(0, alpha)) * 255))
  return `#${a}${toHex(r)}${toHex(g)}${toHex(b)}`
}
