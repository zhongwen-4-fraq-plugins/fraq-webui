# 🪤 fraq CLI 不识别 --version，需用 version 子命令

SUMMARY: `fraq --version` 会报 "No value provided for subcommand" 并以非零码退出；版本检查必须用 `fraq version`（或 `fraq v`）。

READ WHEN: 当需要检测 fraq CLI 是否安装、读取版本，或写环境检查/安装功能时

---

CLI 0.9.0（cmd-ts 定义）中 `version` 是子命令而非全局 flag；用 `--version` 做探测会把"已安装"误判成"未安装"。Windows 上 `fraq`/`npm` 是 `.cmd` 垫片，Node `spawn` 需经 shell（或 `cmd /c`）执行；`exec` 天然走 shell，无弃用警告。
