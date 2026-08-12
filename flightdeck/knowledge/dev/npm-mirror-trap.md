# 🪤 Windows 上 npm 直连官方源报 ECONNRESET

SUMMARY: 本机 npm 直连 registry.npmjs.org 经常 ECONNRESET/超时（约 1-5 分钟才失败）；加 `--registry=https://registry.npmmirror.com` 可正常安装。
READ WHEN: 当 npm install 报 ECONNRESET、网络 read 超时，或安装新依赖失败时

---

用法：`npm install <包> --registry=https://registry.npmmirror.com`。

不要改用户的全局 registry（当前 .npmrc 里有 npmjs.org 的 authToken）；用单次命令参数即可。装完若 npm 仍在跑 audit/收尾导致超时，检查 `node_modules` 与 package.json 已更新后再继续。
