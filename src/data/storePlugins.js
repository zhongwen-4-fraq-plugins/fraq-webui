// 插件商店条目的处理逻辑：分类标签、过滤、已安装判断。

export const CATEGORY_LABELS = {
  infrastructure: '基础服务',
  development: '开发与运维',
  management: '管理工具',
  information: '资讯与生活',
  media: '媒体与创作',
  ai: '人工智能',
  social: '社交与互动',
  entertainment: '娱乐与游戏',
  'game-tools': '游戏辅助',
  utilities: '工具与效率',
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] ?? category
}

export function filterStorePlugins(plugins, query = '') {
  const q = query.trim().toLowerCase()
  if (!q) return plugins
  return plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(q) ||
      plugin.description.toLowerCase().includes(q) ||
      categoryLabel(plugin.category).includes(q),
  )
}

// 通过名称尾部匹配判断商店插件是否已在本地安装
export function isInstalled(localPlugins, storePlugin) {
  return localPlugins.some((local) => {
    const name = storePlugin.name.toLowerCase()
    const id = local.id.toLowerCase()
    return name === id || name.endsWith(`/${id}`) || name.endsWith(`-${id}`)
  })
}
