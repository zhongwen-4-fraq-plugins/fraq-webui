# 🪤 Windows 下 apply_patch 的两个传参坑：.bat 截断多行、双引号被吞

SUMMARY: 这台机器上 `apply_patch` 实际是 `apply_patch.bat` 转发给 codex.exe：走 bat 会因 `%*` 经 cmd 解析而截断多行参数（报 last line of the patch must be End Patch），补丁文本里的 ASCII 双引号也会被 PowerShell 传参吞掉（报 Failed to find expected lines，且错误回显里引号不见）。做法：直接调用 codex.exe，并让补丁内容不出现双引号。

READ WHEN: 当在这台 Windows 机器上用 apply_patch 经常失败（Invalid patch / Failed to find expected lines），或要改的代码行本身含双引号时

---

## 坑 1：走 .bat 会截断多行补丁

`Get-Command apply_patch` 得到的是 `apply_patch.bat`，内容是把参数转给 codex.exe 的 `--codex-run-as-apply-patch`。cmd 处理 `%*` 时会在换行处截断，于是补丁只剩第一行，报错固定是 `Invalid patch: The last line of the patch must be '*** End Patch'`。

解法：绕开 bat，直接调用 codex.exe（PowerShell 把多行字符串作为单个参数传给 exe 是没问题的）：

路径取自 bat 里的相对路径，形如 `C:\Users\admin\.vscode\extensions\openai.chatgpt-<版本>-win32-x64\bin\windows-x86_64\codex.exe`，调用方式为 `& $exe --codex-run-as-apply-patch $patch`。

## 坑 2：补丁文本里的 ASCII 双引号会被吞

PowerShell 5.1 往原生 exe 传参时不保护 ASCII 双引号，补丁里的 `属性=值` 会变成 `属性=值`，于是 `Failed to find expected lines`（错误回显里引号是消失的，正是线索）。空补丁（参数整个丢了）则报 `requires a UTF-8 PATCH argument`。

解法：

- 补丁里一律不写 ASCII 双引号 —— 注释、文档用中文引号或单引号即可。
- 必须改的那一行代码本身含双引号（如 Vue 模板属性）时，别硬碰：改用不会被解析的方式写文件，例如 `[System.IO.File]::WriteAllText(path, text, (New-Object System.Text.UTF8Encoding($false)))`，或用 `ReadAllText` 读入后 `-replace` 再写回（无 BOM，与现有文件一致）。

## 配套习惯

- 用 here-string 拼补丁后要 TrimEnd 掉末尾的回车/换行字符（PowerShell 里两个字符都要 trim），否则末尾多一个空行同样会报 last line 不是 End Patch。
- 补丁结束后用 `git status --short` 或读回文件确认落盘（编码/换行是否正确）。
