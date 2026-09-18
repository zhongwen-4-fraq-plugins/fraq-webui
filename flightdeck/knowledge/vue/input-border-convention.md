# fraq-webui 输入框边框与聚焦外圈约定（base.css 统一）

SUMMARY: 全站文本类 input / select / textarea 的默认边框统一在 `src/styles/base.css` 用 `border: 1px solid transparent` 去掉；聚焦统一由 base.css 给 `outline: 2px solid var(--success)`（沿用原来的聚焦绿）+ `outline-offset: 1px` 的外圈表示。组件样式不要再自己写 border，也不要再靠 `:focus` 改 `border-color`。

READ WHEN: 当新增或修改 fraq-webui 的输入框 / 表单控件（边框、聚焦、状态色）时

---

## 边框：统一透明，边框色留给状态用

组件里的 `.field__input` / `.install-input` / `.cfg-input` / `.store__search-input` 等都没写 `border`，屏幕上看到的方框其实是浏览器给输入框的默认边框。

做法（2026-09-19）：`base.css` 里

```
input:not([type='radio']):not([type='checkbox']),
select,
textarea {
  border: 1px solid transparent;
}
```

保留 1px 实线但默认透明，组件只需改 `border-color` 就能出现状态色；radio / checkbox 排除在外（它们用 `accent-color` 原生渲染）。

仍然靠边框色表达的状态：

- 设置页未保存：`.field__input.field__input--dirty { border-color: var(--primary) }`。scoped 后实际选择器是 `.field__input.field__input--dirty[data-v-x]`，比 base.css 的 `input:not(...)...` 更具体，所以压得过透明边框（已用计算样式实测确认）。
- 校验失败：`.field__input[aria-invalid='true']` / `.login__input[aria-invalid='true']` 只改 `background`（浅红底），不动边框。

## 聚焦：用外圈，不要再用边框

聚焦提示原来是各组件各写一份（`.field__input:focus { border-color: var(--success) }`、`.login__input:focus { border-color: var(--success); outline: none }`），2026-09-19 统一收到 `base.css` 一份：

```
input:not([type='radio']):not([type='checkbox']):not([type='range']):not([type='color']):focus,
select:focus,
textarea:focus {
  outline: 2px solid var(--success);
  outline-offset: 1px;
}
```

- 颜色沿用原来的聚焦绿 `--success`。设计令牌里另有 `--focus`（青，色相 210）标注为"键盘焦点外圈"，设置页拖拽区就是 `:focus-visible + var(--focus)`；想把输入框也统一成青色，只改上面这一处即可。
- 排除 `[type=range]` 和 `[type=color]`：滑杆和取色器自带反馈，套外圈很脏。
- 用 `:focus` 而不是 `:focus-visible`：原来鼠标点进输入框也会变绿，保持一致。

## ⚠ 为什么不能保留"聚焦只改 border-color"的写法

去掉默认边框后，聚焦若只改 `border-color`，屏幕上真正显眼的是浏览器自带焦点框：Chrome 的 UA 样式会给输入框画 `outline: ... auto`（auto 按系统/自身配色渲染，实测是 1px 深色圈），它盖在 1px 绿边外面，绿几乎看不见 —— 用户当时的原话是"你把输入框激活色弄没了"。所以聚焦必须显式写 `outline` 才是稳定的激活色。

排查手法：用无头 Chrome 打印 `getComputedStyle` 的 outline / border 值，见 knowledge/agent/headless-chrome-css-verify.md。

## 注意

- 登录框 `.login__input` 曾写死 `border: 1px solid var(--ink)`（墨色），已同步改成透明。
- 输入框底色来自 `var(--app-component-bg, var(--surface-2))`；组件外观调成完全透明时输入框会和背景糊在一起，优先调底色而不是把边框加回来。
- 新增输入框：套用现有 `.field__input` / `.install-input` / `.cfg-input` 之一即可，不要单独加 border，也不要单独写 :focus。