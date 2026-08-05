# fraq 插件注册表（fraqjs/registry）参考

SUMMARY: 官方插件商店数据源是 fraqjs/registry 的 plugins.json；JSON 含 version/updatedAt/categories/plugins，每个插件条目含 name/version/description/category/repository/market。
READ WHEN: 当需要读取 fraq 插件商店或注册表数据时

---

数据地址：https://raw.githubusercontent.com/fraqjs/registry/main/plugins.json
商店页面：https://fraq.dev/plugins

结构：

```json
{
  "version": 1,
  "updatedAt": "...",
  "categories": ["infrastructure", "development", "..."],
  "plugins": {
    "fraqjs/hono": {
      "name": "@fraqjs/plugin-hono",
      "version": "0.3.0",
      "description": "...",
      "category": "infrastructure",
      "repository": "https://github.com/fraqjs/fraq",
      "market": { "unlisted": false }
    }
  }
}
```

要点：
- raw.githubusercontent 带 `Access-Control-Allow-Origin: *`，浏览器可直接 fetch。
- `market.unlisted === true` 的条目不在商店展示。
- category 是英文 id，中文标签映射见 src/data/storePlugins.js 的 CATEGORY_LABELS。
- 已安装匹配启发式：本地插件 id 等于注册表 name 本身，或注册表 name 以 `/id` 或 `-id` 结尾（见 data/storePlugins.js 的 isInstalled）。
