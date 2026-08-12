<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { NCard, NDescriptions, NDescriptionsItem, NIcon, NButton } from 'naive-ui'
import { Activity, Apps, ArrowRight } from '@vicons/tabler'
import { store } from '../services/store.js'
import { formatDuration, formatTime } from '../data/format.js'
import { logTimeLabel } from '../data/logs.js'
import { pluginSummary } from '../data/plugins.js'
import { CORE_STATUS } from '../models/coreStatus.js'
import { POLL_INTERVAL_MS } from '../core/config.js'
import ErrorBanner from '../components/ErrorBanner.vue'
import PageHeader from '../components/PageHeader.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import StatusBadge from '../components/StatusBadge.vue'

let pollTimer = null
let tickTimer = null
let statsSource = null
const now = ref(Date.now())

onMounted(async () => {
  await Promise.all([store.refreshCore(), store.refreshStats(), store.refreshPlugins(), store.refreshLogs()])
  // 消息统计走 SSE 实时推送，不再依赖轮询
  statsSource = new EventSource('/api/stats/stream')
  statsSource.onmessage = (event) => {
    try {
      store.setStats(JSON.parse(event.data))
    } catch {
      // 忽略格式异常的心跳
    }
  }
  tickTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  pollTimer = setInterval(() => {
    store.refreshCore()
    store.refreshPlugins()
    store.refreshLogs()
  }, POLL_INTERVAL_MS)
})

onUnmounted(() => {
  statsSource?.close()
  clearInterval(tickTimer)
  clearInterval(pollTimer)
})

const coreStatusMeta = computed(() => {
  const status = store.state.core.status
  if (status === CORE_STATUS.running) return { tone: 'success', label: '运行中' }
  if (status === CORE_STATUS.stopped) return { tone: 'neutral', label: '已停止' }
  if (status === CORE_STATUS.error) return { tone: 'danger', label: '异常' }
  return { tone: 'neutral', label: '空闲' }
})

const summary = computed(() => pluginSummary(store.state.plugins))

const abnormalPlugins = computed(() =>
  store.state.plugins.filter((plugin) => plugin.status === 'error'),
)

const recentLogs = computed(() => store.state.logs.slice(-5).reverse())

const logTone = (level) => {
  if (level === 'error') return 'danger'
  if (level === 'warn') return 'warning'
  if (level === 'debug') return 'neutral'
  return 'info'
}

// 在线时长：本地每秒跳动，不依赖轮询刷新
const onlineDuration = computed(() => {
  const core = store.state.core
  if (core.status !== CORE_STATUS.running || !core.startedAt) return '—'
  return formatDuration(Math.floor((now.value - core.startedAt) / 1000))
})
</script>

<template>
  <div>
    <PageHeader
      title="概览"
      description="一眼确认 fraq 核心、插件和日志的健康状况。"
    />

    <ErrorBanner
      v-if="store.state.errors.core"
      :message="store.state.errors.core"
      @retry="store.refreshCore"
    />

    <NCard class="app-panel" :bordered="false" size="large">
      <template #header>
        <span class="panel__heading">
          <NIcon size="18"><Activity /></NIcon>
          核心状态
        </span>
      </template>

      <SkeletonBlock v-if="store.state.loading.core" :lines="3" />

      <NDescriptions
        v-else
        :column="{ xs: 1, s: 2, m: 3 }"
        label-placement="left"
        size="small"
      >
        <NDescriptionsItem label="状态">
          <StatusBadge :tone="coreStatusMeta.tone">{{ coreStatusMeta.label }}</StatusBadge>
        </NDescriptionsItem>
        <NDescriptionsItem label="事件连接">
          {{ store.state.core.connected ? '在线' : '断开' }}
        </NDescriptionsItem>
        <NDescriptionsItem label="服务地址">
          <span class="facts__mono">{{ store.state.core.baseUrl || '—' }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="版本">
          <span class="facts__mono">{{ store.state.core.version || '—' }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="启动时间">
          {{ formatTime(store.state.core.startedAt) }}
        </NDescriptionsItem>
        <NDescriptionsItem label="在线时长">{{ onlineDuration }}</NDescriptionsItem>
        <NDescriptionsItem label="收到消息">
          <span class="facts__num">{{ store.state.stats.available ? store.state.stats.received : '—' }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="发出消息">
          <span class="facts__num">{{ store.state.stats.available ? store.state.stats.sent : '—' }}</span>
        </NDescriptionsItem>
        <NDescriptionsItem label="每分钟发送">
          <span class="facts__num">{{ store.state.stats.available ? store.state.stats.sentPerMinute : '—' }}</span>
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard class="app-panel" :bordered="false" size="large">
      <template #header>
        <span class="panel__heading">
          <NIcon size="18"><Apps /></NIcon>
          插件健康
        </span>
      </template>

      <SkeletonBlock v-if="store.state.loading.plugins" :lines="2" />

      <template v-else>
        <p class="summary-line">
          共 {{ summary.total }} 个插件 · 运行中 {{ summary.running }} ·
          已停用 {{ summary.stopped }} · 异常 {{ summary.error }}
        </p>

        <p v-if="abnormalPlugins.length === 0" class="summary-quiet">
          所有插件运行正常。
        </p>

        <ul v-else class="abnormal-list">
          <li v-for="plugin in abnormalPlugins" :key="plugin.id">
            <StatusBadge tone="danger">异常</StatusBadge>
            <span class="abnormal-list__name">{{ plugin.name }}</span>
            <RouterLink
              :to="{ name: 'logs', query: { level: 'error', q: plugin.name } }"
              class="abnormal-list__link"
            >
              查看错误日志
            </RouterLink>
          </li>
        </ul>
      </template>
    </NCard>

    <NCard class="app-panel" :bordered="false" size="large">
      <template #header>
        <div class="panel__header">
          <span class="panel__heading panel__heading--dot">最近日志</span>
          <RouterLink :to="{ name: 'logs' }" class="panel__more">
            <NButton text size="small">
              查看全部日志
              <template #icon>
                <NIcon size="16"><ArrowRight /></NIcon>
              </template>
            </NButton>
          </RouterLink>
        </div>
      </template>

      <SkeletonBlock v-if="store.state.loading.logs" :lines="4" />

      <p v-else-if="recentLogs.length === 0" class="summary-quiet">
        暂无日志输出，一切安静。
      </p>

      <ul v-else class="log-list">
        <li v-for="entry in recentLogs" :key="entry.time + entry.message" class="log-row">
          <StatusBadge :tone="logTone(entry.level)" :dot="true">
            {{ logTimeLabel(entry.time) }}
          </StatusBadge>
          <span class="log-row__module">{{ entry.module }}</span>
          <span class="log-row__message">{{ entry.message }}</span>
        </li>
      </ul>
    </NCard>
  </div>
</template>

<style scoped>
.app-panel + .app-panel {
  margin-top: var(--space-5);
}

.app-panel {
  --n-color: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
}

.panel__heading {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--app-text-color, var(--ink));
}

.panel__heading--dot::before {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--primary);
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
}

.panel__more {
  text-decoration: none;
}

.facts__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  word-break: break-all;
}

.facts__num {
  font-variant-numeric: tabular-nums;
}

.summary-line {
  font-size: var(--text-sm);
  color: var(--muted);
}

.summary-quiet {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--muted);
}

.abnormal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-3) 0 0;
  padding: 0;
  list-style: none;
}

.abnormal-list li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-area-bg, var(--bg));
}

.abnormal-list__name {
  font-size: var(--text-sm);
  font-weight: 500;
}

.abnormal-list__link {
  margin-left: auto;
  font-size: var(--text-xs);
  text-decoration: none;
}

.abnormal-list__link:hover {
  text-decoration: underline;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.log-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-area-bg, var(--bg));
  font-size: var(--text-sm);
}

.log-row__module {
  flex-shrink: 0;
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
}

.log-row__message {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
