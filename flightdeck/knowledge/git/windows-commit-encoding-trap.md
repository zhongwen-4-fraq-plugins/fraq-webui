# 🪤 Windows 下 git commit -F 会把中文/emoji 存成 ?

SUMMARY: Windows 上 `git commit -F <utf8文件>` 会把非 ASCII 字符变成 `?`；提交含中文或 emoji 的消息时直接 `git commit -m` 传参即可。
READ WHEN: 当在 Windows 上提交含中文或 emoji 的 commit 消息时

---

现象：用 UTF-8 消息文件走 `git commit -F`，提交后 `git log` 里中文和 emoji 全变成 `?`。
原因：Windows 上 `-F` 读取消息文件时按 ANSI/OEM 代码页（GBK）解码，UTF-8 非 ASCII 字节被丢弃。
做法：改用 `git commit -m "📝 [docs] 摘要"` 直接传参，Git for Windows 会把 Unicode argv 正确转为 UTF-8 存储。
