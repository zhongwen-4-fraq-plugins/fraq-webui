# Index — dashboard

## State

初版已实现（2026-08-06）：Vue 3 + Vite 四屏（概览/插件/日志/设置），内置模拟数据服务，生产构建通过；待浏览器视觉确认与真实后端对接。

## Next

- 浏览器打开 `npm run dev` 检查视觉效果（本环境无截图能力，未做视觉确认）。
- 确认真实管理接口方案后，把 services/api.js 换成 fetch 实现。

## Read now

- design-brief.md
- ../../../PRODUCT.md

## Read if

- 需要连接/协议细节时读项目根 `reference/fraq/` 下 milky-server 与 webui-gateway 源码。

## Progress

Done:
- PRODUCT.md（产品上下文）
- dashboard 设计简报（四屏：概览、插件、日志、设置；结构草图）
- 初版实现：应用外壳、四屏、设计令牌（OKLCH）、模拟数据服务、WCAG AA 对比度验证、生产构建通过
- 修复主页轮询抖动（后台刷新不再触发骨架屏）

Current:
- 浏览器视觉确认与打磨

## Open questions

- 核心启停/插件管理的后端接口方案：配套后端提供，还是先只接 milky-server 能覆盖的部分。
