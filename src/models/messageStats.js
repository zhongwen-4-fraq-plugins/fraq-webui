// 消息统计数据模型：收/发总数与每分钟发送条数。

export function createMessageStats(raw = {}) {
  return {
    available: raw.available === true,
    received: raw.received ?? 0,
    sent: raw.sent ?? 0,
    sentPerMinute: raw.sentPerMinute ?? 0,
  }
}
