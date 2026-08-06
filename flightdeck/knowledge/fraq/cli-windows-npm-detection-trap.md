# 🪤 fraq CLI 0.7.0 在 Windows 上探测 npm 失败

SUMMARY: @fraqjs/cli 0.7.0 在 Windows 上因 `cmd /s /c "npm.cmd" --version` 引号处理 bug，永远判定 npm 不在 PATH，`fraq start` 直接退出；升级到 0.9.0+ 解决。
READ WHEN: 当 `fraq start` 报 "package manager 'npm' is not found in the system PATH"

---

现象：`fraq start` 同步完 lockfile 后报 `Specified package manager 'npm' is not found in the system PATH` 并以 code 1 退出，即使 npm 明明在 PATH 里（`D:\node\npm.cmd` 存在、`npm --version` 正常）。
原因：CLI 0.7.0 用 `spawnSync(cmd.exe, ['/d','/s','/c', '"D:\node\npm.cmd" --version'])` 探测包管理器；Node 在 Windows 上不再给已带引号的参数加外层引号，cmd 把带引号的路径当成命令名执行，版本探测永远失败。
做法：升级全局 CLI：`npm install -g @fraqjs/cli@latest`（0.9.0 已修复）。配套管理服务启动子进程时也要显式把 node 目录与全局 npm bin 目录补进 PATH。
