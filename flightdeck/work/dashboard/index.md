# Index — dashboard

## State

已接入真实后端（2026-08-06）：配套管理服务（server/，Node + Hono）拉起真实 fraq 进程（CLI 已升级 0.9.0），核心启停/插件/日志/设置均为真实数据；前端 mock 已移除。

## Next

- 浏览器打开 `npm run dev` 检查视觉效果（本环境无截图能力，未做视觉确认）。
- 浏览器验证管理界面（http://127.0.0.1:8787）。
- 重启 8787 服务后浏览器打开 /install 验证安装页。

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
- 新增"安装"页：环境检查（fraq CLI `fraq version`、协议端 `get_login_info`）、CLI 一键 npm 全局安装、协议端（Yogurt / LuckyLilliaBot）GitHub 版本列表选择 + 下载解压 + 启动/停止（进度轮询）。已用临时服务实测下载 Yogurt Windows 包并自动定位 yogurt.exe。
- 修复协议端检查与代理 401：检查改直连 MILKY_URL（带 JSON body），放行 milky 代理单段端点，代理令牌回退到 fraq.yml milky.accessToken；前端区分已连接/在运行/未运行。
- 协议端安装目录可自定义：安装页输入完整路径（存 .fraq-webui-state.json，默认 protocols/），下载时生效。
- Node.js 检查与安装：node/npm 版本检测；缺失时从 nodejs.org 选 LTS 下载 Windows zip 便携版（免管理员），装好后便携 node 目录加入子进程 PATH（buildChildEnv），fraq/npm 自动优先使用。
- 安装目录支持选择器：`GET /api/install/dirs`（列磁盘/子目录），安装页"选择"按钮弹窗浏览并填入完整路径。
- 设置页背景图本地上传改为拖拽上传区（点击/拖放选图，显示文件名，键盘可操作）；外观模型新增 background.fileName。
- 会话失效自动跳登录：任意 API 401（auth 接口除外）即回登录页，toast 移到登录门控外。
- 侧栏左下角显示 fraq-webui 版本号 + 检查更新按钮：`GET /api/update/check`（git fetch 远程比对 HEAD..remote/main 提交数）；已合并远程 zhongwen-4-fraq-plugins/fraq-webui（仅 LICENSE）并推送同步。

## Open questions

- 已解决：采用配套管理服务（server/）。剩余：单个插件的真实运行状态无法从外部获取（近似为进程运行即全部运行）。
- 协议端下载依赖 GitHub 网络（release-assets CDN 偶发超时，已加重试）；LuckyLilliaBot 的 .msi/.exe 安装包只下载不自动装，需手动运行。
- 已解决：fraq 核心经 webui 代理调用协议端 API 401 的根源是 webui 自身鉴权中间件，已放行 milky 代理路径。
