// 插件的统计与排序。

import { PLUGIN_STATUS } from '../models/plugin.js'

export function pluginSummary(plugins) {
  const summary = { total: plugins.length, running: 0, stopped: 0, error: 0 }
  for (const plugin of plugins) {
    if (plugin.status === PLUGIN_STATUS.error) summary.error += 1
    else if (plugin.status === PLUGIN_STATUS.running) summary.running += 1
    else summary.stopped += 1
  }
  return summary
}

export function sortPlugins(plugins) {
  const rank = { error: 0, running: 1, stopped: 2 }
  return [...plugins].sort((a, b) => rank[a.status] - rank[b.status])
}
