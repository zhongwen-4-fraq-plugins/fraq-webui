# ⚠️ 外观默认值改动不覆盖 localStorage 已存值

SUMMARY: 外观配置存于浏览器 localStorage（fraq-webui.appearance），改代码默认值不会覆盖已存值；用户反馈"没效果"时先点"恢复默认外观"，且重置必须覆盖全部区域。

READ WHEN: 修改外观默认值后用户反馈"没效果/没变化"；或新增/调整外观区域时

---

外观（顶栏/侧栏/内容区/组件/弹窗/文字/背景）由 `src/services/store.js` 写入浏览器 localStorage，`normalizeAppearance` 加载时优先用已存值，代码里的 `DEFAULT_APPEARANCE` 只在首次（无存储）时生效。

陷阱：

- 改 `appearance.js` 默认值后，用过的浏览器仍显示旧值 → 需要"恢复默认外观"或清理 localStorage。
- `SettingsView.resetAppearance` 曾漏掉 components 和 text 两个区域，点了重置这两项也不回默认 → 重置要覆盖全部区域。
- 滑杆下限曾固定 20%（仅靠数值输入框可输 0）；2026-08-12 输入框删除后下限改回 0，否则无法手动调到完全透明。删除输入框类控件时，要确认剩下的控件能覆盖全范围。
