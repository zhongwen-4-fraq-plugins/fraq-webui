// fraq.yml 的读写：插件列表、启停插件、设置。
// 注意：读取时绝不返回插件配置内容（可能包含 API Key 等密钥）。

import fs from 'node:fs'
import { parse, stringify } from 'yaml'
import { CONFIG_PATH, VERSIONS_PATH } from '../core/config.js'
import { plugin } from '../models/plugin.js'
import { settings } from '../models/settings.js'

function readConfig() {
  const text = fs.readFileSync(CONFIG_PATH, 'utf8')
  return parse(text)
}

function writeConfig(doc) {
  fs.writeFileSync(CONFIG_PATH, stringify(doc))
}

function readVersions() {
  try {
    return parse(fs.readFileSync(VERSIONS_PATH, 'utf8')) ?? {}
  } catch {
    return {}
  }
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

export function installPlugin(name) {
  const doc = readConfig()
  doc.plugins ??= {}
  doc.plugins[name] ??= {}
  writeConfig(doc)
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
  })
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
