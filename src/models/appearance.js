// 界面外观数据模型：背景图与各区域 ARGB 颜色。

const DEFAULT_COLOR = { color: '#ffffff', alpha: 0.72, blur: 16 }
const DEFAULT_COMPONENT = { color: '#fbfbfb', alpha: 0, blur: 0 }
const DEFAULT_DIALOG = { color: '#ffffff', alpha: 0.92, blur: 16 }
const DEFAULT_TEXT = { color: '#2b2e33', alpha: 1, blur: 0 }

const DEFAULT_LOG_COLOR = { color: '', bgColor: '#ffffff', bgAlpha: 0 }

export const DEFAULT_APPEARANCE = {
  background: { mode: 'default', value: '', fileName: '', blur: 0 }, // default | url | file
  colors: {
    topbar: { ...DEFAULT_COLOR },
    sidebar: { color: '#fbfbfb', alpha: 0.72, blur: 16 },
    area: { color: '#fbfbfb', alpha: 0.72, blur: 16 },
    components: { ...DEFAULT_COMPONENT },
    dialog: { ...DEFAULT_DIALOG },
    text: { ...DEFAULT_TEXT },
  },
  logColors: {
    error: { color: '#b4232a', bgColor: '#ffffff', bgAlpha: 0 },
    warn: { color: '#d9b500', bgColor: '#ffffff', bgAlpha: 0 },
    info: { ...DEFAULT_LOG_COLOR },
    debug: { ...DEFAULT_LOG_COLOR },
  },
}

function normalizeColor(raw, fallback) {
  const color = typeof raw?.color === 'string' && /^#[0-9a-f]{3,6}$/i.test(raw.color) ? raw.color : fallback.color
  const alpha = Number.isFinite(raw?.alpha) ? Math.min(1, Math.max(0, raw.alpha)) : fallback.alpha
  const blur = Number.isFinite(raw?.blur) ? Math.min(40, Math.max(0, raw.blur)) : fallback.blur
  return { color, alpha, blur }
}

function normalizeLogColor(raw, fallback) {
  const color =
    typeof raw?.color === 'string' && /^#[0-9a-f]{3,6}$/i.test(raw.color) ? raw.color : fallback.color
  const bgColor =
    typeof raw?.bgColor === 'string' && /^#[0-9a-f]{3,6}$/i.test(raw.bgColor)
      ? raw.bgColor
      : fallback.bgColor
  const bgAlpha = Number.isFinite(raw?.bgAlpha) ? Math.min(1, Math.max(0, raw.bgAlpha)) : fallback.bgAlpha
  return { color, bgColor, bgAlpha }
}

export function normalizeAppearance(raw = {}) {
  return {
    background: {
      mode: ['default', 'url', 'file'].includes(raw.background?.mode) ? raw.background.mode : 'default',
      value: typeof raw.background?.value === 'string' ? raw.background.value : '',
      fileName: typeof raw.background?.fileName === 'string' ? raw.background.fileName : '',
      blur: Number.isFinite(raw.background?.blur)
        ? Math.min(40, Math.max(0, raw.background.blur))
        : 0,
    },
    colors: {
      topbar: normalizeColor(raw.colors?.topbar, DEFAULT_APPEARANCE.colors.topbar),
      sidebar: normalizeColor(raw.colors?.sidebar, DEFAULT_APPEARANCE.colors.sidebar),
      area: normalizeColor(raw.colors?.area, DEFAULT_APPEARANCE.colors.area),
      components: normalizeColor(raw.colors?.components, DEFAULT_APPEARANCE.colors.components),
      dialog: normalizeColor(raw.colors?.dialog, DEFAULT_APPEARANCE.colors.dialog),
      text: normalizeColor(raw.colors?.text, DEFAULT_APPEARANCE.colors.text),
    },
    logColors: {
      error: normalizeLogColor(raw.logColors?.error, DEFAULT_APPEARANCE.logColors.error),
      warn: normalizeLogColor(raw.logColors?.warn, DEFAULT_APPEARANCE.logColors.warn),
      info: normalizeLogColor(raw.logColors?.info, DEFAULT_APPEARANCE.logColors.info),
      debug: normalizeLogColor(raw.logColors?.debug, DEFAULT_APPEARANCE.logColors.debug),
    },
  }
}

export function createDefaultAppearance() {
  return JSON.parse(JSON.stringify(DEFAULT_APPEARANCE))
}
