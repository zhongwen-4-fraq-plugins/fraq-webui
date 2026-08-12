# ⚠️ background 多图层只有最后一层能放颜色

SUMMARY: `background: A, B` 里 A、B 都是颜色时整条声明无效（color-mix() 的结果也是颜色），轨道/背景会直接消失；多层背景要保底可见时，改用单个嵌套 color-mix 表达式。

READ WHEN: 写多层 background 时；或滑杆轨道/背景突然消失时

---

CSS 规范：background 多个图层时，只有最后一层可以包含颜色，其余层必须是可以平铺的图像（如 gradient）。`color-mix()` 的返回值是 `<color>`，所以两层都写颜色会令整条声明在解析时失效，元素背景退回透明。

本项目的滑杆轨道保底 20% 可见的写法（2026-08-12 修正）：

```css
background: color-mix(
  in srgb,
  var(--app-component-bg, var(--surface-2)) 60%,
  color-mix(in srgb, var(--surface-2) 50%, transparent)
);
```

透明度：0.6 × 组件透明度 + 0.4 × 0.5 = 保底 0.2。曾用两层颜色实现导致轨道消失，提交 eb91cfc 修复。
