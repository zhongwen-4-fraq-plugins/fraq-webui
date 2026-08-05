<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { Activity, ArrowRight, Blocks } from '@lucide/vue'
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

onMounted(async () => {
  await Promise.all([store.refreshCore(), store.refreshPlugins(), store.refreshLogs()])
  pollTimer = setInterval(() => {
    store.refreshCore()
    store.refreshPlugins()
    store.refreshLogs()
  }, POLL_INTERVAL_MS)
})

onUnmounted(() => {
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

    <section class="panel" aria-labelledby="core-heading">
      <h3 id="core-heading" class="panel__heading">
        <Activity class="panel__heading-icon" aria-hidden="true" />
        核心状态
      </h3>

      <SkeletonBlock v-if="store.state.loading.core" :lines="3" />

      <dl v-else class="facts">
        <div class="facts__item">
          <dt>状态</dt>
          <dd><StatusBadge :tone="coreStatusMeta.tone">{{ coreStatusMeta.label }}</StatusBadge></dd>
        </div>
        <div class="facts__item">
          <dt>事件连接</dt>
          <dd>{{ store.state.core.connected ? '在线' : '断开' }}</dd>
        </div>
        <div class="facts__item">
          <dt>服务地址</dt>
          <dd class="facts__mono">{{ store.state.core.baseUrl || '—' }}</dd>
        </div>
        <div class="facts__item">
          <dt>版本</dt>
          <dd class="facts__mono">{{ store.state.core.version || '—' }}</dd>
        </div>
        <div class="facts__item">
          <dt>启动时间</dt>
          <dd>{{ formatTime(store.state.core.startedAt) }}</dd>
        </div>
        <div class="facts__item">
          <dt>在线时长</dt>
          <dd>{{ formatDuration(store.state.core.onlineSeconds) }}</dd>
        </div>
      </dl>
    </section>

    <section class="panel" aria-labelledby="plugins-heading">
      <h3 id="plugins-heading" class="panel__heading">
        <Blocks class="panel__heading-icon" aria-hidden="true" />
        插件健康
      </h3>

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
            <RouterLink :to="{ name: 'plugins' }" class="abnormal-list__link">
              查看详情
            </RouterLink>
          </li>
        </ul>
      </template>
    </section>

    <section class="panel" aria-labelledby="logs-heading">
      <div class="panel__header">
        <h3 id="logs-heading" class="panel__heading">
          <span class="panel__heading-dot" aria-hidden="true" />
          最近日志
        </h3>
        <RouterLink :to="{ name: 'logs' }" class="panel__more">
          查看全部日志
          <ArrowRight aria-hidden="true" />
        </RouterLink>
      </div>

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
    </section>
  </div>
</template>

<style scoped>
.panel {
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.panel + .panel {
  margin-top: var(--space-5);
}

.panel__heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.panel__heading-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--primary);
}

.panel__heading-dot {
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
  margin-bottom: var(--space-4);
}

.panel__header .panel__heading {
  margin-bottom: 0;
}

.panel__more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  text-decoration: none;
  white-space: nowrap;
}

.panel__more:hover {
  text-decoration: underline;
}

.panel__more svg {
  width: 1rem;
  height: 1rem;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: var(--space-4) var(--space-5);
  margin: 0;
}

.facts__item dt {
  color: var(--muted);
  font-size: var(--text-xs);
  margin-bottom: var(--space-1);
}

.facts__item dd {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

.facts__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs) !important;
  word-break: break-all;
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
  background: var(--bg);
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
  background: var(--bg);
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
