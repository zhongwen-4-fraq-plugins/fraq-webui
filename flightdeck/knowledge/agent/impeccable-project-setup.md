# fraq-webui 里跑 impeccable 的固定参数

SUMMARY: impeccable skill 装在这台机器的全局技能目录（不在项目里），脚本必须用绝对路径调用；本项目 PRODUCT.md 存在（register=product、platform=web）、DESIGN.md 缺失；context-signals 报告 devServer.running=false 是因为它只认 vite 默认端口，而本项目平时由 server/index.js 在 8787 托管 dist。

READ WHEN: 当在本项目用 $impeccable 做 UI 设计/评审/打磨，或要跑它的 context / context-signals / detect 脚本时

---

## 路径与调用

- skill 基目录：`C:\Users\admin\.agents\skills\impeccable`（SKILL.md 里写的 `.agents/skills/impeccable/...` 是相对项目根的路径，本项目里没有这个目录，照抄会找不到文件）。
- 脚本一律用绝对路径、cwd 保持项目根，例如 `node C:\Users\admin\.agents\skills\impeccable\scripts\context.mjs`。
- 常用脚本：`context.mjs`（打印 PRODUCT.md / DESIGN.md）、`context-signals.mjs`（JSON 信号）、`detect.mjs --json <路径...>`（本地静态检测，无需网络）。

## 本项目现状（2026-09-19 实测）

- 根目录有 `PRODUCT.md`：register = product、platform = web；PRINCIPLES 强调轻量、状态可见、装饰让位功能、WCAG 2.1 AA；反参考里明确排斥花哨渐变 / 玻璃拟态 / 超大圆角。
- `DESIGN.md` 缺失（context 的 RESOLVED_CONTEXT 里 designPath 为 null），而 `src/styles/tokens.css` 已经把颜色（OKLCH）、间距、字号、层级、阴影、圆角全都令牌化了 —— 适合用 `document` 命令固化成 DESIGN.md。
- `context-signals.mjs` 的 `devServer.running` 恒为 false：它探测的是 vite 默认端口（5173），而本项目平时由 `server/index.js` 在 `http://127.0.0.1:8787` 托管 `dist/`。要用 `live` 做浏览器迭代就先 `npm run dev`。
- `detect.mjs --json src public` 目前只有一条命中：`InstallView.vue:949` 的 `transition: width`（布局属性动画，warning）。
