// 插件注册表解析：把插件键名转成 npm 包名、拉取 peerDependencies、递归收集需要一并安装的依赖插件。

import semver from 'semver'
import * as fraqConfig from './fraqConfig.js'

const REGISTRY = 'https://registry.npmjs.org'

// fraq.yml 键名 -> npm 包名
//   fraqjs/hono -> @fraqjs/plugin-hono
//   botweb      -> fraq-plugin-botweb
export function toPackageName(key) {
  const parts = key.split('/')
  if (parts.length === 2) {
    const [scope, name] = parts
    return scope === 'fraqjs' ? `@fraqjs/plugin-${name}` : `@${scope}/fraq-plugin-${name}`
  }
  return `fraq-plugin-${key}`
}

// npm 包名 -> fraq.yml 键名（仅 fraq 插件返回键名，库/框架返回 null）
export function packageNameToKey(packageName) {
  if (packageName.startsWith('@')) {
    const [scope, name] = packageName.split('/')
    if (name.startsWith('plugin-')) return `${scope.slice(1)}/${name.slice('plugin-'.length)}`
    if (name.startsWith('fraq-plugin-')) return `${scope.slice(1)}/${name.slice('fraq-plugin-'.length)}`
    return null
  }
  if (packageName.startsWith('fraq-plugin-')) return packageName.slice('fraq-plugin-'.length)
  return null
}

async function fetchPackage(packageName, version) {
  const url = version
    ? `${REGISTRY}/${packageName}/${encodeURIComponent(version)}`
    : `${REGISTRY}/${packageName}/latest`
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) {
    throw new Error(`无法获取 ${packageName} 的包信息（HTTP ${response.status}）`)
  }
  return response.json()
}

// 获取完整包元数据（含所有版本的 peerDependencies）
async function fetchPackageMeta(packageName) {
  const response = await fetch(`${REGISTRY}/${packageName}`, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) {
    throw new Error(`无法获取 ${packageName} 的包信息（HTTP ${response.status}）`)
  }
  return response.json()
}

// 在 peer 范围内解析兼容版本
async function resolveVersion(packageName, range) {
  const meta = await fetchPackageMeta(packageName)
  const versions = Object.keys(meta.versions ?? {})
  if (!range || range === '*' || range === 'latest') {
    const latest = meta['dist-tags']?.latest ?? versions.at(-1)
    return latest
      ? { version: latest, peerDeps: meta.versions[latest]?.peerDependencies ?? {} }
      : null
  }
  const match = semver.maxSatisfying(versions, range)
  return match
    ? { version: match, peerDeps: meta.versions[match]?.peerDependencies ?? {} }
    : null
}

function pluginPeers(data) {
  const result = []
  for (const [pkg, range] of Object.entries(data.peerDependencies ?? {})) {
    const key = packageNameToKey(pkg)
    if (key) {
      result.push({ key, range })
    }
  }
  return result
}

// 解析安装计划：主插件 + 其依赖插件（递归，最多 3 层，跳过已安装的）
export async function resolveInstallPlan(name, version) {
  const key = fraqConfig.toPluginKey(name)
  const own = await fetchPackage(toPackageName(key), version || undefined)
  const plan = [{ key, version: own.version }]
  const seen = new Set([key])
  const installed = new Set(fraqConfig.getPlugins(false).map((plugin) => plugin.id))

  const pending = pluginPeers(own)
  let depth = 0
  while (pending.length > 0 && depth < 3) {
    const current = pending.splice(0)
    for (const { key: depKey, range } of current) {
      if (seen.has(depKey) || installed.has(depKey)) {
        continue
      }
      seen.add(depKey)
      try {
        const resolved = await resolveVersion(toPackageName(depKey), range)
        if (!resolved) {
          continue
        }
        plan.push({ key: depKey, version: resolved.version })
        for (const peer of pluginPeers({ peerDependencies: resolved.peerDeps })) {
          if (!seen.has(peer.key) && !installed.has(peer.key)) {
            pending.push(peer)
          }
        }
      } catch {
        // 依赖解析失败不影响主插件安装
      }
    }
    depth += 1
  }

  return plan
}
