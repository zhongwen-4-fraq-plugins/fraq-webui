# ⚠️ background 多图层只有最后一层能放颜色

SUMMARY: `background: A, B` 里 A、B 都是颜色时整条声明无效（color-mix() 的结果也是颜色），轨道/背景会直接消失；多层背景要保底可见时，改用单个嵌套 color-mix 表达式。

READ WHEN: 写多层 background 时；或滑杆轨道/背景突然消失时

---

CSS 规范：background 多个图层时，只有最后一层可以包含颜色，其余层必须是可以平铺的图像（如 gradient）。`color-mix()` 的返回值是 `<color>`，所以两层都写颜色会令整条声明在解析时失效，元素背景退回透明。

本项目滑杆轨道最终方案（2026-08-12）：不用多层 background，由 `store.js` 用组件颜色选择器的颜色预计算轨道色（透明度 ×60%、保底 20%）写入 `--app-slider-track-bg`，CSS 直接 `background: var(--app-slider-track-bg, var(--surface-2))`。

```css
background: var(--app-slider-track-bg, var(--surface-2));
```

轨道色 = 组件选择器颜色，透明度 = max(组件透明度 × 0.6, 0.2)，保证轨道不消失且颜色跟随组件。曾用两层颜色实现导致轨道消失，提交 eb91cfc 修复；后改为 JS 预计算，提交 16ccaf9。
