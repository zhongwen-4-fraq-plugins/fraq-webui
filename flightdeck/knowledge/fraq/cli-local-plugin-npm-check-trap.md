# 🪤 fraq CLI 启动时校验每个插件，本地 file: 插件会失败

SUMMARY: `fraq start` 会为 fraq.yml 里每个插件从 npm registry 拉 package.json 做依赖校验；本地 `file:` 依赖插件（未发布到 npm）会直接报 "Failed to fetch package.json" 并以 code 1 退出。
READ WHEN: 当想在 fraq.yml 里用本地插件（file: 依赖），或 fraq start 报 Failed to fetch package.json for <plugin>

---

现象：给 fraq.yml 的 plugins 加了本地插件（additionalDependencies 用 `file:../../...` 指向本仓库），`fraq start` 在依赖校验阶段报 `Failed to fetch package.json for fraq-plugin-xxx@0.1.0: Not Found` 退出。
原因：CLI（0.9.0）启动时对每个插件调用 registry 拉 package.json 检查 peerDependencies；未发布的本地包 404 → 抛错。
结论：自定义统计/管理逻辑不要走"本地插件"路线。更可靠的方案是让管理服务做 Milky 协议的透明反向代理（fraq.yml 的 milky.url 指向服务，服务转发 HTTP API 与 WebSocket 事件），在转发处计数收/发消息。

同类坑：fraq.yml 的插件键名**不能带 `fraq-plugin-` 前缀**——CLI 会把键名再包一层（`fraq-plugin-botweb` → 找 `fraq-plugin-fraq-plugin-botweb`），报 `Failed to fetch latest package.json ...: Not Found`。键名用短名（`botweb`），npm 包名 `fraq-plugin-*`、`@fraqjs/plugin-*` 是自动映射出来的。商店安装时要把包名反转为键名（`@fraqjs/plugin-hono` → `fraqjs/hono`，`fraq-plugin-x` → `x`），并同步写 versions.yml。

版本组合坑：商店插件有自己的 peerDependencies，装新插件可能引入连锁版本冲突（CLI 用 `--legacy-peer-deps` 安装，冲突不在安装时报，而是运行时才炸）。实例：botweb@1.0.0 要求 webui-gateway ^0.1.0 + fraq ^0.14.1；若按"最新版"装 webui-gateway@0.4.0，它 peer 要求 fraq ^0.16.1 + hono ^0.3.0，升级后旧插件（如 botweb 1.0.0）又在 fraq 0.17 的新内核上报 `Cannot read properties of undefined (reading 'key')`。结论：升级 fraq 前先核对所有插件的 peer 范围，选一套互相兼容的版本（本机可用组合：fraq 0.14.0 + hono 0.2.1 + webui-gateway 0.1.0 + botweb 1.0.0）。
