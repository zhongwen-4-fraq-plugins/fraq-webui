// 插件商店（注册表）条目数据模型。

export function createStorePlugin(raw = {}) {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    version: raw.version ?? '',
    description: raw.description ?? '',
    category: raw.category ?? '',
    repository: raw.repository ?? '',
    updatedAt: raw.updatedAt ?? null,
  }
}
