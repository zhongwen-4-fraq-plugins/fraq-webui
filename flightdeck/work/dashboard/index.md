# Index — dashboard

## State

已接入真实后端（2026-08-06）：配套管理服务（server/，Node + Hono）拉起真实 fraq 进程（CLI 已升级 0.9.0），核心启停/插件/日志/设置均为真实数据；前端 mock 已移除。

## Next

- 浏览器打开 `npm run dev` 检查视觉效果（本环境无截图能力，未做视觉确认）。
- 浏览器验证管理界面（http://127.0.0.1:8787）。

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
- 图标切换到 tabler（unplugin-icons 按需打包）
- 真实后端接入：server/ 管理服务（进程启停、fraq.yml 读写、日志缓冲与 SSE）、前端 httpApi 传输层
- 消息收发统计：milky 透明代理（fraq.yml milky.url 指向本服务），收=事件流 message_receive、发=发送 API 计数，概览展示

Current:
- 浏览器视觉确认与打磨；插件级运行状态（目前以进程运行近似）

## Open questions

- 已解决：采用配套管理服务（server/）。剩余：单个插件的真实运行状态无法从外部获取（近似为进程运行即全部运行）。
