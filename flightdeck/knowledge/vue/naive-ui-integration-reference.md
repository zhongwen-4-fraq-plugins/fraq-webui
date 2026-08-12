# Naive UI + @vicons 集成参考

SUMMARY: 界面已从手写 CSS 组件迁移到 Naive UI；外观 ARGB 设置通过 buildThemeOverrides 映射到 NConfigProvider 主题，玻璃效果用 CSS 变量覆盖 Naive 的 --n-color，图标来自 @vicons/tabler。
READ WHEN: 当继续用 Naive UI 调整 fraq-webui 界面，新增/替换组件或图标，或排查外观设置不生效时

---

## 主题接线

- `src/core/naiveTheme.js` 的 `buildThemeOverrides(appearance)` 把外观模型（ARGB 颜色）转成 Naive UI 的 `themeOverrides`；`App.vue` 用 `NConfigProvider :theme-overrides` 传入，外观修改即时生效。
- 品牌色在 `naiveTheme.js` 里是固定 hex（由 tokens.css 的 OKLCH 转换而来）；外观只驱动 body/card/modal/input/text 等公共色。
- 半透明玻璃效果：Naive 组件根元素暴露 `--n-color` 等 CSS 变量，可用 scoped 样式覆盖（如 `.app-panel { --n-color: var(--app-area-bg) }`），再配合 `backdrop-filter: blur(var(--app-area-blur))`；NLayout/NLayoutContent 需要 `--n-color: transparent` 才不会盖住页面背景图。

## 图标命名（@vicons/tabler 与旧 ~icons/tabler 的差异）

- 新版 tabler 图标集有重命名：`blocks` → `Apps`、`layout-dashboard` → `LayoutGrid`、`loader-2` → `Loader`；其余 `menu-2` → `Menu2`、`circle-check` → `CircleCheck` 等直接转 PascalCase。
- 图标组件放进 Naive 组件用 `<NIcon><IconX /></NIcon>`；渲染函数里用 `h(NIcon, null, { default: () => h(icon) })`。

## 已替换的关键组件

- AppButton → NButton（variant 映射 primary/secondary/ghost/danger/danger-ghost）
- StatusBadge → NTag、ConfirmDialog → NModal（preset card）、EmptyState → NEmpty、ErrorBanner → NAlert、SkeletonBlock → NSkeleton
- 表单控件 → NInput/NInputNumber/NSelect/NSwitch/NColorPicker/NSlider/NUpload
- ToastHost → NMessageProvider + ToastBridge（watch store.state.toasts 出队渲染）

## 已知注意点

- `NRadio`/`NRadioGroup` 的选项内容需用 `:deep(.n-radio__label)` 设 flex 才能让 `margin-left: auto` 的附加信息靠右。
- 移除 unplugin-icons 后，`vite.config.js` 不再有 Icons 插件；新增图标直接 `npm install @vicons/<set>`。
