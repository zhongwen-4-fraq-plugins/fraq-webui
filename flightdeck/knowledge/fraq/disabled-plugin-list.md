# Fraq WebUI 停用插件的列表来源
SUMMARY: `fraq.yml` 的 `plugins` 只表示已启用插件；`versions.yml` 会保留安装版本。插件列表必须合并两者，并以是否存在于 `plugins` 判断启用状态。
READ WHEN: 当修改 fraq-webui 的插件列表、启停或卸载逻辑时

---

`getPlugins()` 以两个文件中的插件键名并集建立列表：键名在 `fraq.yml.plugins` 中即为启用，否则为已停用。这样停用操作删除配置项后，用户仍可看见插件并一键重新启用。

卸载时同时移除 `fraq.yml.plugins[id]` 与 `versions.yml[id]`，防止已卸载插件被当作停用插件保留在列表中。
