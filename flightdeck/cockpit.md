# Cockpit — fraq-webui

Focus: fraq-webui：用 Vue 3 + Vite 为 fraq 构建轻量 Web 管理界面（核心启停、插件管理、日志与状态）。

## In flight

* dashboard — 已接真实后端（server/）；插件列表已支持显示已停用插件，外观、日志、安装页持续迭代中（work/dashboard/）

## Next

* 刷新 http://127.0.0.1:8787 验证组件透明度默认 0、滑杆轨道保底可见与自定义 CSS 功能；随后验证 /install 安装页

## Open questions

* 已解决：核心启停/插件管理由配套管理服务（server/）承担。剩余：协议端安装依赖 GitHub 网络，国内环境偶发超时。
* 已解决：my-fraq-app（另一个独立项目）启动即崩是 0.x 时代插件与 1.x kernel 的服务令牌不匹配；2026-09-19 已把该 app 依赖升到 1.x 线（fraq 1.1.1 + 插件 1.x，npm 安装），`node index.js` 实测启动通过。版本矩阵、探测法与双锁文件坑见 knowledge/fraq/kernel-service-token-mismatch-trap.md。
