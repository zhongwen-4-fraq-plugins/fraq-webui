# Cockpit — fraq-webui

Focus: fraq-webui：用 Vue 3 + Vite 为 fraq 构建轻量 Web 管理界面（核心启停、插件管理、日志与状态）。

## In flight

* dashboard — 已接真实后端（server/）；外观、日志、插件、安装页持续迭代中（work/dashboard/）

## Next

* 刷新 http://127.0.0.1:8787 验证组件透明度默认 0、滑杆轨道不随透明度全透明（保底 20%）与输入框删除（旧 localStorage 值需点"恢复默认外观"）；随后验证 /install 安装页

## Open questions

* 已解决：核心启停/插件管理由配套管理服务（server/）承担。剩余：协议端安装依赖 GitHub 网络，国内环境偶发超时。
