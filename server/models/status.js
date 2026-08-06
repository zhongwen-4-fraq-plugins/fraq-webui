// 核心状态数据模型：与前端 models/coreStatus.js 保持一致。

export function coreStatus({ running, pid, startedAt, baseUrl, version }) {
  const onlineSeconds = running && startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0
  return {
    status: running ? 'running' : 'stopped',
    connected: running, // 事件连接状态无法从外部获取，用进程状态近似
    baseUrl: baseUrl ?? '',
    version: version ?? '',
    startedAt,
    onlineSeconds,
  }
}
