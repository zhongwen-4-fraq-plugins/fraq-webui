# 🪤 轮询刷新触发骨架屏导致页面抖动

SUMMARY: 后台轮询 refresh 时若把 loading 重新置为 true，视图会每轮询周期在骨架屏与内容之间塌缩，整页周期性抖动；loading 只在首次加载时为 true，后台刷新保持内容稳定。
READ WHEN: 当页面在轮询刷新时出现周期性抖动或闪烁

---

现象：概览页每 5 秒"抖"一下，区块高度塌缩又恢复。
原因：`refreshCore()` / `refreshPlugins()` 每次轮询都把 `loading` 置回 true，视图切换到骨架屏（高度变矮），数据返回后再切回内容，形成周期性布局跳动。
做法：store 里加 `loaded` 标记，`loading` 只在 `!loaded` 时为 true；首次成功后 `loaded = true`，后台刷新不再闪骨架屏。错误时保留 `loaded = false`，重试仍会显示骨架屏。
