# fraq-webui 输入框默认无边框（base.css 统一透明边框）

SUMMARY: 全站输入框（文本框 / select / textarea）的默认边框统一在 `src/styles/base.css` 用 `border: 1px solid transparent` 去掉，组件 CSS 一律不自己写 border；聚焦变绿、未保存主色、校验失败浅红底等状态色仍由组件改 `border-color` / `background`。新增输入框时不要再加边框。

READ WHEN: 当新增或修改 fraq-webui 的输入框 / 表单控件样式时

---

## 为什么统一在 base.css

组件里的 `.field__input` / `.install-input` / `.cfg-input` / `.store__search-input` 等都没写 `border`，屏幕上看到的方框其实是浏览器给输入框的默认边框；而 `.field__input:focus { border-color: var(--success) }` 这类状态提示又依赖 `border-color`，所以不能简单写 `border: none`（会把状态提示一起吃掉）。

做法（2026-09-19）：`base.css` 里

```
input:not([type='radio']):not([type='checkbox']),
select,
textarea {
  border: 1px solid transparent;
}
```

保留 1px 实线但默认透明，组件只需改 `border-color` 就能出现状态色；radio / checkbox 排除在外（它们用 `accent-color` 原生渲染）。

## 注意

- 登录框 `.login__input` 曾写死 `border: 1px solid var(--ink)`（墨色），已同步改成透明，聚焦仍是绿色。
- 输入框底色来自 `var(--app-component-bg, var(--surface-2))`；组件外观调成完全透明时输入框会和背景糊在一起，优先调底色而不是把边框加回来。
- 新增输入框：套用现有 `.field__input` / `.install-input` / `.cfg-input` 之一即可，不要单独加 border。
