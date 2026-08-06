// 界面外观数据模型：背景图与各区域 ARGB 颜色。

const DEFAULT_COLOR = { color: '#ffffff', alpha: 0.72 }

export const DEFAULT_APPEARANCE = {
  background: { mode: 'default', value: '' }, // default | url | file
  colors: {
    topbar: { ...DEFAULT_COLOR },
    sidebar: { color: '#fbfbfb', alpha: 0.72 },
    area: { color: '#fbfbfb', alpha: 0.72 },
  },
}

function normalizeColor(raw, fallback) {
  const color = typeof raw?.color === 'string' && /^#[0-9a-f]{3,6}$/i.test(raw.color) ? raw.color : fallback.color
  const alpha = Number.isFinite(raw?.alpha) ? Math.min(1, Math.max(0, raw.alpha)) : fallback.alpha
  return { color, alpha }
}

export function normalizeAppearance(raw = {}) {
  return {
    background: {
      mode: ['default', 'url', 'file'].includes(raw.background?.mode) ? raw.background.mode : 'default',
      value: typeof raw.background?.value === 'string' ? raw.background.value : '',
    },
    colors: {
      topbar: normalizeColor(raw.colors?.topbar, DEFAULT_APPEARANCE.colors.topbar),
      sidebar: normalizeColor(raw.colors?.sidebar, DEFAULT_APPEARANCE.colors.sidebar),
      area: normalizeColor(raw.colors?.area, DEFAULT_APPEARANCE.colors.area),
    },
  }
}
