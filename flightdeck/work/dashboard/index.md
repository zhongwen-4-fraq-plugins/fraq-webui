# Index — dashboard

## State

已接入真实后端（2026-08-06）：配套管理服务（server/，Node + Hono）拉起真实 fraq 进程（CLI 已升级 0.9.0），核心启停/插件/日志/设置均为真实数据；前端 mock 已移除。

外观与设置页持续迭代至 2026-08-12：液态玻璃、ARGB 分区外观、日志配色、透明度滑杆、安装页等均已落地并提交。

2026-08-12 已用 Naive UI 全量重构界面（外壳/侧栏/顶栏/四屏+安装页/通用组件），图标切换为 xicons（@vicons/tabler），旧 unplugin-icons/iconify 依赖已移除；生产构建与 dev 冒烟测试通过。

## Next

- 浏览器验证 Naive UI 重构后的界面：外观设置（注意 localStorage 旧值，需点"恢复默认外观"）、插件页表格与操作、安装页选择器/radio/进度条、日志页过滤与跟随、登录页。
- 刷新 http://127.0.0.1:8787 验证：组件透明度默认 0、透明度数值输入框已删、自定义 CSS 功能仍生效。
- 需要时 git push 推送远程。

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
- 2026-08-12 Naive UI 重构：17 个组件 + 5 视图全部改为 Naive UI 组件（NLayout/NMenu/NButton/NTag/NModal/NDataTable/NForm 控件等），外观 ARGB 通过 buildThemeOverrides 映射主题，玻璃效果用 --n-color CSS 变量覆盖；图标全部换 @vicons/tabler（blocks→Apps、layout-dashboard→LayoutGrid、loader-2→Loader），移除 @iconify/* 与 unplugin-icons；npm 装包失败时用 npmmirror 镜像。
- 新增"安装"页：环境检查（fraq CLI `fraq version`、协议端 `get_login_info`）、CLI 一键 npm 全局安装、协议端（Yogurt / LuckyLilliaBot）GitHub 版本列表选择 + 下载解压 + 启动/停止（进度轮询）。已用临时服务实测下载 Yogurt Windows 包并自动定位 yogurt.exe。
- 修复协议端检查与代理 401：检查改直连 MILKY_URL（带 JSON body），放行 milky 代理单段端点，代理令牌回退到 fraq.yml milky.accessToken；前端区分已连接/在运行/未运行。
- 协议端安装目录可自定义：安装页输入完整路径（存 .fraq-webui-state.json，默认 protocols/），下载时生效。
- Node.js 检查与安装：node/npm 版本检测；缺失时从 nodejs.org 选 LTS 下载 Windows zip 便携版（免管理员），装好后便携 node 目录加入子进程 PATH（buildChildEnv），fraq/npm 自动优先使用。
- 安装目录支持选择器：`GET /api/install/dirs`（列磁盘/子目录），安装页"选择"按钮弹窗浏览并填入完整路径。
- 设置页背景图本地上传改为拖拽上传区（点击/拖放选图，显示文件名，键盘可操作）；外观模型新增 background.fileName。
- 会话失效自动跳登录：任意 API 401（auth 接口除外）即回登录页，toast 移到登录门控外。
- 侧栏左下角显示 fraq-webui 版本号 + 检查更新按钮：`GET /api/update/check`（git fetch 远程比对 HEAD..remote/main 提交数）；已合并远程 zhongwen-4-fraq-plugins/fraq-webui（仅 LICENSE）并推送同步。
- 安装目录"选择"优先弹系统原生文件夹选择器（powershell -EncodedCommand + FolderBrowserDialog，仅 Windows），失败回退页面内目录浏览。
- 插件配置功能：官方插件（fraqjs/hono、milky-server、webui-gateway、kysely、message-store、conversation、random、milky-webhook、takumi、ai）按源码手写表单，其余插件 JSON 编辑器；`GET/PUT /api/plugins/:id/config`，密钥字段（apiKey/token/secret 等）打码 ******，保存时未改动则还原原值。
- 核心状态接管孤儿进程：服务重启后旧 fraq 核心仍在运行时，`/api/core` 通过 netstat 探测 fraqjs/hono 端口（默认 4649）找到 PID 并接管，状态不再误报未运行，停止也能正常 kill。
- ai 插件配置改为 SDK 下拉选择（9 个 SDK 选项）。
- 透明度滑杆标注"透明度/模糊"；2026-08-12 组件透明度默认改为 0、透明度数值输入框删除；滑杆轨道色跟随组件颜色选择器（JS 预计算，透明度 ×60% 保底 25%），可调值下限为 0。
- 弹窗独立外观（--app-dialog-bg/--app-dialog-blur）、背景图模糊设置、toast 进度条动画（4500ms）。
- 日志页"日志"旁设置图标（右 15px、文字间距 10px、背景透明），可改各日志级别文字颜色与底色；错误/警告整行变色（底色去掉）；长错误报告折叠为一行可点击展开。
- 警告文字色 #d9b500。
- 插件配置弹窗：模型供应商卡片背景改为跟随组件外观（--app-component-bg），修复组件透明时供应商区仍纯白的问题。
- 自定义 CSS 功能：设置页界面外观下新增 CSS 输入框，内容存浏览器 localStorage（fraq-webui.customCss），通过注入 `<style id="fraq-webui-custom-css">` 实时生效。

## Open questions

- 已解决：采用配套管理服务（server/）。剩余：单个插件的真实运行状态无法从外部获取（近似为进程运行即全部运行）。
- 协议端下载依赖 GitHub 网络（release-assets CDN 偶发超时，已加重试）；LuckyLilliaBot 的 .msi/.exe 安装包只下载不自动装，需手动运行。
- 已解决：fraq 核心经 webui 代理调用协议端 API 401 的根源是 webui 自身鉴权中间件，已放行 milky 代理路径。
