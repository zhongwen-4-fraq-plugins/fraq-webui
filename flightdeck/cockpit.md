# Cockpit — fraq-webui

Focus: fraq-webui：用 Vue 3 + Vite 为 fraq 构建轻量 Web 管理界面（核心启停、插件管理、日志与状态）。

## In flight

* dashboard — 已接真实后端（server/）；插件列表已支持显示已停用插件，外观、日志、安装页持续迭代中（work/dashboard/）

## Next

* 刷新 http://127.0.0.1:8787 验证组件透明度默认 0、滑杆轨道保底可见与自定义 CSS 功能；随后验证 /install 安装页

## Open questions

* 已解决：核心启停/插件管理由配套管理服务（server/）承担。剩余：协议端安装依赖 GitHub 网络，国内环境偶发超时。
* 已解决：my-fraq-app（另一个独立项目，webui 的 appDir 正指向它）启动即崩是 0.x 插件与 1.x kernel 的服务令牌不匹配；2026-09-19 在项目根把 `versions.yml` 四个官方插件升到 1.x、`fraq.yml` 的 `fraqVersion` 升到 1.1.1 后，`fraq start` 实测启动通过。注意 app/ 是 CLI 生成物，直接改它会被覆盖。见 knowledge/fraq/kernel-service-token-mismatch-trap.md 与 knowledge/fraq/cli-generated-app-dir-trap.md。
