// 插件数据模型：与前端 models/plugin.js 保持一致。

export function plugin({ id, name, version, enabled, coreRunning }) {
  return {
    id,
    name,
    description: '',
    version: version ?? '',
    // 进程运行时视为全部已加载；无法从外部区分单个插件的运行状态
    status: coreRunning ? 'running' : 'stopped',
    enabled,
  }
}
