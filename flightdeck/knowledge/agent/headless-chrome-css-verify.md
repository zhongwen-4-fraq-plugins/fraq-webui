# 用无头 Chrome 核对 fraq-webui 元素的计算样式

SUMMARY: 这台机器没有浏览器自动化框架；要确认某个元素真正的颜色 / 边框 / 外圈 / 尺寸时，用 Chrome 无头模式 + 自制探针 HTML：拷 `dist/assets` 的 CSS、手写带 `data-v-` 哈希的 DOM、用 `--dump-dom` 打印 `getComputedStyle` 的值。颜色一律以计算值为准，截图只能证明"看着像"。

READ WHEN: 当需要验证 fraq-webui 某个元素的实际计算样式（颜色、边框、外圈、尺寸），或截图看着不对但不确定原因时

---

## 步骤

1. 建临时目录（如 `%TEMP%\uitest-<随机>`），把要用的 CSS 从 `dist/assets/` 拷进去改成好认的名字（`index.css` / `settings.css` / `install.css` …）。
2. 写探针 HTML：`<link>` 上这些 CSS，body 里放目标元素。**class 必须带 scoped 的 `data-v-xxxxxxxx` 属性**，scoped 选择器靠属性命中，少一个就完全不生效。
3. 查值：页面脚本把 `getComputedStyle(el)` 的 `borderTopColor` / `outlineColor` / `outlineWidth` 等拼成文本写进 `<pre>`，再用 `--dump-dom` 把最终 DOM 打到 stdout，`Select-String` 捞结果。
4. 需要看整体观感时再截图：`--screenshot=xxx.png` + `--window-size=W,H`。

## 命令模板

```
$d = "$env:TEMP\uitest-xxxx"
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu `
  --no-first-run --no-default-browser-check --user-data-dir="$d\profile" `
  --virtual-time-budget=1500 --dump-dom "file:///$($d -replace '\\','/')/test.html"
```

- `--user-data-dir` 指到临时目录，不碰真实 Chrome 配置。
- 要聚焦就靠 URL 参数（如 `?f=set`）在脚本里 `document.getElementById(q).focus()`；无头模式下没有真的鼠标点击可用。

## 坑

- **scoped 哈希会变**：改了 Vue 组件内容，`data-v-` 哈希就变，探针页要重新从产物里抄：`rg -o '\.field__input\[data-v-[a-z0-9]+\]' dist/assets`，否则样式全部不生效。
- **必须先 `npm run build`**：探针用的是 `dist/` 产物，不是 `src/`。
- **这台机器上 `Set-Content -Encoding UTF8` 会报参数找不到**（`NamedParameterNotFound`），写文件统一用 `[IO.File]::WriteAllText(path, text, (New-Object Text.UTF8Encoding $false))`，这样也保证无 BOM、和仓库一致。
- 改动后重跑截图要用新的文件名，Chrome 会缓存"参数相同=同一任务"的判定。