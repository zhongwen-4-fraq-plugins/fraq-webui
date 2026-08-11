// fraq.yml 的读写：插件列表、启停插件、设置。
// 注意：读取时绝不返回插件配置内容（可能包含 API Key 等密钥）。

import fs from 'node:fs'
import path from 'node:path'
import { parse, stringify } from 'yaml'
import { getAppDir } from '../core/config.js'
import { plugin } from '../models/plugin.js'
import { settings } from '../models/settings.js'

const configPath = () => path.join(getAppDir(), 'fraq.yml')
const versionsPath = () => path.join(getAppDir(), 'versions.yml')

function readConfig() {
  const text = fs.readFileSync(configPath(), 'utf8')
  return parse(text)
}

function writeConfig(doc) {
  fs.writeFileSync(configPath(), stringify(doc))
}

function readVersions() {
  try {
    return parse(fs.readFileSync(versionsPath(), 'utf8')) ?? {}
  } catch {
    return {}
  }
}

function writeVersions(versions) {
  fs.writeFileSync(versionsPath(), stringify(versions))
}

// 把 npm 包名转回 fraq.yml 的插件键名：
//   @fraqjs/plugin-hono   -> fraqjs/hono
//   fraq-plugin-botweb    -> botweb
export function toPluginKey(name) {
  const trimmed = name.trim()
  if (trimmed.startsWith('@')) {
    const [scope, pkg] = trimmed.split('/')
    if (pkg?.startsWith('plugin-')) {
      return `${scope.slice(1)}/${pkg.slice('plugin-'.length)}`
    }
    return trimmed
  }
  if (trimmed.startsWith('fraq-plugin-')) {
    return trimmed.slice('fraq-plugin-'.length)
  }
  return trimmed
}

export function getPlugins(coreRunning) {
  const doc = readConfig()
  const versions = readVersions()
  const entries = doc.plugins ?? {}
  return Object.entries(entries).map(([id, config]) =>
    plugin({
      id,
      name: id,
      version: versions[id] ?? '',
      enabled: true,
      coreRunning,
    }),
  )
}

export function setPluginEnabled(id, enabled) {
  const doc = readConfig()
  doc.plugins ??= {}
  if (enabled) {
    if (!(id in doc.plugins)) {
      doc.plugins[id] = {}
    }
  } else {
    delete doc.plugins[id]
  }
  writeConfig(doc)
}

export function installPlugin(name, version) {
  const key = toPluginKey(name)
  const doc = readConfig()
  doc.plugins ??= {}
  doc.plugins[key] ??= {}
  writeConfig(doc)
  if (version) {
    const versions = readVersions()
    versions[key] = version
    writeVersions(versions)
  }
}

// 一次性写入多个插件及其版本（安装时连同依赖一起）
export function addPlugins(entries) {
  const doc = readConfig()
  doc.plugins ??= {}
  for (const { key } of entries) {
    doc.plugins[key] ??= {}
  }
  writeConfig(doc)

  const versions = readVersions()
  for (const { key, version } of entries) {
    if (version) {
      versions[key] = version
    }
  }
  writeVersions(versions)
}

export function uninstallPlugin(id) {
  const doc = readConfig()
  delete doc.plugins?.[id]
  writeConfig(doc)
}

export function getSettings() {
  const doc = readConfig()
  return settings({
    baseUrl: doc.milky?.url ?? '',
    hasAccessToken: Boolean(doc.milky?.accessToken),
    appDir: getAppDir(),
  })
}

// 服务端内部使用：协议端连通性检查需要真实令牌（此函数不暴露给 API）
export function getMilkyConfig() {
  const doc = readConfig()
  return {
    baseUrl: doc.milky?.url ?? '',
    accessToken: doc.milky?.accessToken ?? '',
  }
}

export function saveSettings({ baseUrl, accessToken }) {
  const doc = readConfig()
  doc.milky ??= {}
  doc.milky.url = baseUrl
  // 令牌留空表示不修改，避免覆盖已配置的密钥
  if (typeof accessToken === 'string' && accessToken.length > 0) {
    doc.milky.accessToken = accessToken
  }
  writeConfig(doc)
}
