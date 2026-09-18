# 🪤 fraq 启动即崩：0.x 时代插件与 kernel 1.1.x 的服务令牌不匹配

SUMMARY: fraq 1.x 的 kernel 用 `serviceClass.token.key` 解析 `provides`，而 0.14 时代构建的 @fraqjs/plugin-* 里服务类没有 `static token`，启动瞬间抛 `TypeError: Cannot read properties of undefined (reading 'key')`（栈在 PluginRegistry.sortPlugins）；修法是把插件升到 1.x 线，与 @fraqjs/fraq 大版本对齐。

READ WHEN: 当 fraq 应用启动瞬间报 `Cannot read properties of undefined (reading 'key')`（栈在 @fraqjs/kernel 的 PluginRegistry.sortPlugins / LifecycleManager.recursiveApplyPlugins），或把 @fraqjs/fraq 升到 1.x 后插件没跟着升

---

## 现象

`node index.js`（或 `fraq start`）刚启动就崩，栈顶是 `PluginRegistry.sortPlugins`（kernel dist 里 `providers.get(service.token.key)`）：

```
TypeError: Cannot read properties of undefined (reading 'key')
    at PluginRegistry.sortPlugins (.../@fraqjs/kernel/dist/index.mjs:226:57)
    at PluginRegistry.apply (...:205:30)
    at LifecycleManager.recursiveApplyPlugins (...:147:44)
    at RuntimeContext.start (...:649:5)
```

## 根因（2026-09-19 实测）

- kernel 1.x 的插件契约是 `provides: ServiceClass[]`，而 `ServiceClass` 必须自带 `static readonly token = serviceToken('<key>')`；`sortPlugins` 与 `ServiceRegistry.provide` 都直接读 `service.token.key`。
- 0.x 时代（fraq <= 0.17）根本没有 `@fraqjs/kernel` 这个包（`fraq@0.14.0` 的 dependencies 只有 `mitt`），那时的 `provides: [SomeClass]` 不需要令牌，所以那些版本发布出来的 dist 里服务类**没有** `static token`。
- 于是「1.x 的 fraq/kernel + 0.x 的插件」这种混搭，任何插件一加载就在排序阶段炸掉；不是某个插件的问题，装几个 0.x 插件都一样。

实测：`app/node_modules` 里 4 个官方插件的 `provides[0].token` 全是 `undefined`；而从 npm 拉 1.x 版本的同一个插件，dist 里都有 `static token = serviceToken(...)`。

## 一句话判定

看插件的 peer 范围就能认出来，`^0.14.0` 这类是旧线，1.x 线写 `@fraqjs/kernel ^1.1.x`：

```
npm view @fraqjs/plugin-hono@0.2.1 peerDependencies   # peer 是 @fraqjs/fraq ^0.14.0，旧线，与 kernel 1.x 不兼容
npm view @fraqjs/plugin-hono@1.1.0 peerDependencies   # peer 是 @fraqjs/kernel ^1.1.0，1.x 线
```

也可以直接探测已装的包（ESM 一行，把路径换成实际的 node_modules）：

```
node --input-type=module -e 'const m = await import(process.argv[1]); console.log(m.HonoService.token)' file:///D:/app/node_modules/@fraqjs/plugin-hono/dist/index.mjs
```

输出 `undefined` 即为此坑；正常会打印 `{ key: 'fraqjs/hono/HonoService' }`。

## 修法

同一个大版本线内对齐（示例为 2026-09 的 1.x 组合，选项形状与 0.x 兼容，可直接替换依赖版本）：

```
npm i @fraqjs/fraq@1.1.1 @fraqjs/color-log@1.1.1 @fraqjs/plugin-hono@1.1.0 @fraqjs/plugin-ai@1.0.1 @fraqjs/plugin-kysely@1.1.0 @fraqjs/plugin-webui-gateway@1.1.1
```

- `@fraqjs/plugin-ai@1.0.1` 的 peer 是 `@fraqjs/fraq ^1.1.1`，所以 fraq 也要到 1.1.1。
- `@fraqjs/plugin-webui-gateway@1.1.1` 需要 `hono ^4.13.5` 与 `@fraqjs/plugin-hono ^1.1.0`；`ctx.install(webuiGateway, { accessToken })` 选项未变。
- `@fraqjs/plugin-ai` 的 `providers` / `defaultModel` 选项在 1.0.x 仍是同一形状（每项仍可写 `sdk` / `options` / `models`）。
- 自己写的、`provides` 为空的插件（如 `fraq-plugin-doudizhu`）不受影响，只要 peer 写的是 `@fraqjs/fraq ^1.x`。
