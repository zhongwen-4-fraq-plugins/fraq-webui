// Naive UI 主题：把外观设置（ARGB 颜色）映射为 Naive 主题变量。
import { colorToRgba } from '../data/color.js'

// 品牌色（对应 styles/tokens.css 中的 OKLCH 令牌）
export const BRAND = {
  primary: '#007b89',
  primaryHover: '#006d7c',
  primaryPressed: '#00606f',
  success: '#00884b',
  warning: '#d8953d',
  danger: '#cc272e',
}

export function buildThemeOverrides(appearance) {
  const { colors } = appearance
  const text = colorToRgba(colors.text)
  const area = colorToRgba(colors.area)
  const component = colorToRgba(colors.components)
  const dialog = colorToRgba(colors.dialog)
  const faint = colorToRgba({
    color: colors.text.color,
    alpha: Math.max(colors.text.alpha * 0.6, 0.5),
  })
  const border = colorToRgba({ color: colors.text.color, alpha: 0.12 })

  return {
    common: {
      primaryColor: BRAND.primary,
      primaryColorHover: BRAND.primaryHover,
      primaryColorPressed: BRAND.primaryPressed,
      primaryColorSuppl: BRAND.primaryHover,
      successColor: BRAND.success,
      warningColor: BRAND.warning,
      errorColor: BRAND.danger,
      infoColor: BRAND.primary,
      bodyColor: area,
      cardColor: area,
      modalColor: dialog,
      popoverColor: dialog,
      tableColor: area,
      inputColor: component,
      actionColor: component,
      textColorBase: text,
      textColor1: text,
      textColor2: text,
      textColor3: faint,
      dividerColor: border,
      borderColor: border,
      hoverColor: 'rgba(0, 0, 0, 0.04)',
      closeColor: faint,
    },
    Card: { borderRadius: '12px' },
    Button: { borderRadiusMedium: '8px', borderRadiusSmall: '6px' },
    Input: { borderRadius: '8px' },
    Modal: { borderRadius: '12px' },
  }
}
