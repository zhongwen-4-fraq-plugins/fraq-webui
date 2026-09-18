# 🪤 fraq 项目的 app/ 是生成物：改 app/package.json 会被下次启动覆盖

SUMMARY: 由 fraq CLI（或 fraq-webui）管理的项目，依赖版本源是项目根的 `fraq.yml`（`fraqVersion`）与 `versions.yml`（每个插件的版本）；每次 `fraq start` 都用它们重写 `app/package.json` 与 `app/index.js` 并重新安装，直接改 `app/` 里的依赖会在下次启动被覆盖回旧版本。

READ WHEN: 当要改 fraq 项目（目录里有 fraq.yml）的插件版本或依赖时，或改了 app/package.json 却在下次启动失效、版本回退时

---

## 结构

以 `D:\bot\fraq-plugins\my-fraq-app` 为例：

- 根目录：`fraq.yml`（`fraqVersion`、`packageManager`、`milky`、`plugins` 及各插件配置、`additionalDependencies`、`activation`）、`versions.yml`（插件版本，键是 fraq.yml 风格短名如 `fraqjs/hono`、`doudizhu`）、`package.json`（只装 CLI 与 doudizhu 之类本地插件）、`node_modules`。
- `app/`：**生成物**，只有 CLI 写的 `package.json` + `index.js` + `node_modules` + 锁文件。

## 覆盖机制

CLI 的 start 流程（源码 `packages/cli/src/app/index.ts` → `files.ts` → `package-json.ts`）：

1. `writeAppFiles(config)` 重写 `app/package.json` 与 `app/index.js`：依赖 = `@fraqjs/fraq`（取 `fraq.yml` 的 `fraqVersion`）+ `versions.yml` 里每个插件（键名按规则映射成 npm 包名：`fraqjs/hono` → `@fraqjs/plugin-hono`，`doudizhu` → `fraq-plugin-doudizhu`）+ `additionalDependencies`。
2. 依赖指纹变了就重新安装（`packageManager: npm` 走 npm）。
3. 再拉起 `app/index.js`。启动时会打印 `Successfully synced lockfile versions.`，即把 `versions.yml` 与 app 的锁文件对齐。

所以只在 `app/` 里 `npm i` 装上的新版本，下一次 `fraq start` 就会按 `versions.yml` 装回旧版本 —— 现象是「明明升级了，一启动又报老错误」。

## 正确改法

1. 改项目根 `versions.yml` 里对应插件的版本（值必须是字符串）。
2. 需要动框架版本时改 `fraq.yml` 的 `fraqVersion`。
3. 重启核心：fraq-webui 的启停按钮，或在该目录直接 `fraq start`（会重新生成 + 安装 + 启动）。
4. 验证：看 `app/package.json` 是否已是新版本（它是 CLI 重写的，能对上就说明改动生效了）。

## 与 fraq-webui 的关系

webui 的 `appDir`（`.fraq-webui-state.json`）指向项目根，进程管理直接在该目录执行 `fraq start`（`server/services/processManager.js`）。因此 webui 侧改插件版本也应写进 `fraq.yml` / `versions.yml`（安装页就是这么做的），而不是改 `app/`。
