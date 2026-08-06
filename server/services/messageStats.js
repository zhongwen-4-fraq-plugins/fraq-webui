// 消息统计：通过 milky 代理计数收到的消息（事件流）与发出的消息（发送 API 调用）。

const state = {
  received: 0,
  sent: 0,
  sendTimes: [],
}

const subscribers = new Set()

function notify() {
  const stats = getStats()
  for (const send of subscribers) {
    send(stats)
  }
}

export function bumpReceived() {
  state.received += 1
  notify()
}

export function bumpSent() {
  state.sent += 1
  state.sendTimes.push(Date.now())
  if (state.sendTimes.length > 120) {
    state.sendTimes.shift()
  }
  notify()
}

export function getStats() {
  const now = Date.now()
  return {
    available: true,
    received: state.received,
    sent: state.sent,
    sentPerMinute: state.sendTimes.filter((time) => now - time < 60000).length,
  }
}

export function subscribe(send) {
  subscribers.add(send)
  return () => subscribers.delete(send)
}
