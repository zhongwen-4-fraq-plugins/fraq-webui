<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconPlayerPause from '~icons/tabler/player-pause'
import IconPlayerPlay from '~icons/tabler/player-play'
import IconSearch from '~icons/tabler/search'
import IconSettings from '~icons/tabler/settings'
import IconTerminal from '~icons/tabler/terminal-2'
import { store } from '../services/store.js'
import { filterLogs, levelLabel, logTimeLabel } from '../data/logs.js'
import { LOG_LEVEL } from '../models/logEntry.js'
import { LOG_PAGE_SIZE, LOG_POLL_INTERVAL_MS, MAX_VISIBLE_LOGS } from '../core/config.js'
import AppButton from '../components/AppButton.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorBanner from '../components/ErrorBanner.vue'
import PageHeader from '../components/PageHeader.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'

const LEVELS = [
  { value: 'all', label: '全部' },
  { value: LOG_LEVEL.debug, label: '调试' },
  { value: LOG_LEVEL.info, label: '信息' },
  { value: LOG_LEVEL.warn, label: '警告' },
  { value: LOG_LEVEL.error, label: '错误' },
]

const level = ref('all')
const query = ref('')
const debouncedQuery = ref('')
const follow = ref(true)
const hasMore = ref(true)
const loadingOlder = ref(false)
const streamRef = ref(null)
const route = useRoute()
const expanded = reactive(new Set())

const LONG_MESSAGE_LIMIT = 120

function messageKey(entry, index) {
  return `${entry.time}-${entry.module}-${entry.message.slice(0, 60)}`
}

function isCollapsible(entry) {
  return entry.message.length > LONG_MESSAGE_LIMIT
}

function isExpanded(entry, index) {
  return expanded.has(messageKey(entry, index))
}

function toggleMessage(entry, index) {
  const key = messageKey(entry, index)
  if (expanded.has(key)) {
    expanded.delete(key)
  } else {
    expanded.add(key)
  }
}

let pollTimer = null
let debounceTimer = null

onMounted(async () => {
  await store.refreshLogs()
  applyRouteQuery()
  pollTimer = setInterval(store.refreshLogs, LOG_POLL_INTERVAL_MS)
})

watch(() => route.query, applyRouteQuery)

onUnmounted(() => {
  clearInterval(pollTimer)
  clearTimeout(debounceTimer)
})

watch(query, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedQuery.value = value
  }, 300)
})

const visibleLogs = computed(() =>
  filterLogs(store.state.logs, { level: level.value, query: debouncedQuery.value }).slice(
    -MAX_VISIBLE_LOGS,
  ),
)

watch(
  visibleLogs,
  async () => {
    if (follow.value) {
      await nextTick()
      const el = streamRef.value
      if (el) el.scrollTop = el.scrollHeight
    }
  },
  { flush: 'post' },
)

function onScroll() {
  const el = streamRef.value
  if (!el) return
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  if (distanceFromBottom > 64) {
    follow.value = false
  }
}

function applyRouteQuery() {
  const { level: levelQuery, q } = route.query
  if (levelQuery && LEVELS.some((item) => item.value === levelQuery)) {
    level.value = levelQuery
  }
  if (typeof q === 'string') {
    query.value = q
    debouncedQuery.value = q
  }
}

function resumeFollow() {
  follow.value = true
  nextTick(() => {
    const el = streamRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function toggleFollow() {
  if (follow.value) {
    follow.value = false
  } else {
    resumeFollow()
  }
}

async function loadOlder() {
  if (loadingOlder.value) return
  loadingOlder.value = true
  try {
    hasMore.value = await store.loadOlderLogs(store.state.logs.length)
  } catch (error) {
    store.toast('error', error instanceof Error ? error.message : '加载失败')
  } finally {
    loadingOlder.value = false
  }
}

const toneOf = (entry) => {
  if (entry.level === LOG_LEVEL.error) return 'danger'
  if (entry.level === LOG_LEVEL.warn) return 'warning'
  if (entry.level === LOG_LEVEL.debug) return 'neutral'
  return 'info'
}
</script>

<template>
  <div>
    <PageHeader title="日志" description="实时查看 fraq 运行日志，支持按级别过滤与搜索。">
      <template #action>
        <AppButton
          variant="ghost"
          size="icon"
          aria-label="日志颜色设置"
          title="日志颜色设置"
          @click="store.state.logColorsOpen = true"
        >
          <IconSettings aria-hidden="true" />
        </AppButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="store.state.errors.logs" :message="store.state.errors.logs" @retry="store.refreshLogs" />

    <div class="log-toolbar">
      <div class="log-toolbar__levels" role="group" aria-label="按级别过滤">
        <button
          v-for="item in LEVELS"
          :key="item.value"
          type="button"
          class="level-button"
          :class="{ 'level-button--active': level === item.value }"
          :aria-pressed="level === item.value"
          @click="level = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="log-toolbar__search">
        <IconSearch class="log-toolbar__search-icon" aria-hidden="true" />
        <input
          v-model="query"
          type="search"
          class="log-toolbar__search-input"
          placeholder="搜索模块或内容"
          aria-label="搜索日志"
        />
      </div>

      <AppButton variant="secondary" size="sm" @click="toggleFollow">
        <IconPlayerPause v-if="follow" aria-hidden="true" />
        <IconPlayerPlay v-else aria-hidden="true" />
        {{ follow ? '跟随中' : '已暂停' }}
      </AppButton>
    </div>

    <div class="log-panel">
      <SkeletonBlock v-if="store.state.loading.logs" :lines="6" />

      <EmptyState
        v-else-if="visibleLogs.length === 0"
        title="暂无输出"
        description="日志会实时出现在这里。换个过滤条件试试？"
      >
        <template #icon>
          <IconTerminal class="empty-icon" aria-hidden="true" />
        </template>
      </EmptyState>

      <div v-else ref="streamRef" class="log-stream" @scroll="onScroll">
        <AppButton
          v-if="hasMore"
          variant="ghost"
          size="sm"
          class="log-stream__older"
          :loading="loadingOlder"
          @click="loadOlder"
        >
          加载更早的日志
        </AppButton>

        <ul class="log-stream__list">
          <li
            v-for="(entry, index) in visibleLogs"
            :key="entry.time + '-' + entry.module + '-' + index"
            class="log-line"
            :class="{
              'log-line--error': entry.level === 'error',
              'log-line--warning': entry.level === 'warn',
              'log-line--info': entry.level === 'info',
              'log-line--debug': entry.level === 'debug',
            }"
          >
            <span class="log-line__time">{{ logTimeLabel(entry.time) }}</span>
            <span class="log-line__level" :class="`log-line__level--${toneOf(entry)}`">
              {{ levelLabel(entry.level) }}
            </span>
            <span class="log-line__module">{{ entry.module }}</span>
            <span
              class="log-line__message"
              :class="{ 'log-line__message--collapsed': isCollapsible(entry) && !isExpanded(entry, index) }"
              :role="isCollapsible(entry) ? 'button' : undefined"
              :tabindex="isCollapsible(entry) ? 0 : undefined"
              :aria-expanded="isCollapsible(entry) ? isExpanded(entry, index) : undefined"
              :title="isCollapsible(entry) ? (isExpanded(entry, index) ? '点击收起' : '点击展开') : undefined"
              @click="isCollapsible(entry) && toggleMessage(entry, index)"
              @keydown.enter="isCollapsible(entry) && toggleMessage(entry, index)"
              @keydown.space.prevent="isCollapsible(entry) && toggleMessage(entry, index)"
            >{{ entry.message }}</span>
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<style scoped>
.empty-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary);
}

.log-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.log-toolbar__levels {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface));
}

.level-button {
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
}

.level-button:hover {
  color: var(--app-text-color, var(--ink));
}

.level-button--active {
  background: var(--bg);
  color: var(--app-text-color, var(--ink));
  box-shadow: var(--shadow-sm);
}

.log-toolbar__search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 12rem;
}

.log-toolbar__search-icon {
  position: absolute;
  left: var(--space-3);
  width: 1rem;
  height: 1rem;
  color: var(--muted);
  pointer-events: none;
}

.log-toolbar__search-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3) 0 2.25rem;
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

.log-toolbar__search-input::placeholder {
  color: var(--placeholder);
}

.log-panel {
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  padding: var(--space-4);
}

.log-stream {
  max-height: min(32rem, 65dvh);
  overflow-y: auto;
}

.log-stream__older {
  width: 100%;
  margin-bottom: var(--space-2);
}

.log-stream__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.log-line {
  display: grid;
  grid-template-columns: auto 3rem minmax(5rem, 10rem) minmax(0, 1fr);
  gap: var(--space-3);
  align-items: baseline;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
}

.log-line:hover {
  background: var(--app-area-bg, var(--bg));
}

.log-line--error {
  background: var(--log-error-bg, transparent);
  color: var(--log-error-color, var(--danger));
}

.log-line--error .log-line__time,
.log-line--error .log-line__level,
.log-line--error .log-line__module,
.log-line--error .log-line__message {
  color: var(--log-error-color, var(--danger));
}

.log-line--warning {
  background: var(--log-warn-bg, transparent);
  color: var(--log-warn-color, var(--warning-text));
}

.log-line--warning .log-line__time,
.log-line--warning .log-line__level,
.log-line--warning .log-line__module,
.log-line--warning .log-line__message {
  color: var(--log-warn-color, var(--warning-text));
}

.log-line--info {
  background: var(--log-info-bg, transparent);
}

.log-line--info .log-line__time,
.log-line--info .log-line__module,
.log-line--info .log-line__message {
  color: var(--log-info-color, inherit);
}

.log-line--debug {
  background: var(--log-debug-bg, transparent);
}

.log-line--debug .log-line__time,
.log-line--debug .log-line__module,
.log-line--debug .log-line__message {
  color: var(--log-debug-color, inherit);
}

.log-line__time {
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

.log-line__level {
  font-weight: 600;
}

.log-line__level--info {
  color: var(--primary);
}

.log-line__level--warning {
  color: var(--warning);
}

.log-line__level--danger {
  color: var(--danger);
}

.log-line__level--neutral {
  color: var(--muted);
}

.log-line__module {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-line__message {
  min-width: 0;
  word-break: break-word;
  white-space: pre-wrap;
}

.log-line__message--collapsed {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}


@media (max-width: 640px) {
  .log-line {
    grid-template-columns: auto 3rem minmax(0, 1fr);
  }

  .log-line__module {
    display: none;
  }
}
</style>
