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
    <div class="logs-header">
      <h2 class="logs-header__title">
        日志
        <AppButton
          variant="ghost"
          size="icon"
          class="logs-header__gear"
          aria-label="日志颜色设置"
          title="日志颜色设置"
          @click="store.state.logColorsOpen = true"
        >
          <IconSettings aria-hidden="true" />
        </AppButton>
      </h2>
      <p class="logs-header__description">实时查看 fraq 运行日志，支持按级别过滤与搜索。</p>
    </div>

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
/* 日志页标题区 */
.logs-header {
  margin-bottom: var(--space-6);
}

/* 标题：内联弹性布局，容纳右侧设置图标 */
.logs-header__title {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-xl);
  font-weight: 600;
}

/* 日志颜色设置图标：与标题拉开距离 */
.logs-header__gear {
  margin-left: 10px;
}

/* 设置图标：保持透明底（含悬停） */
.logs-header__gear.logs-header__gear,
.logs-header__gear.logs-header__gear:hover {
  background: transparent;
}

/* 副标题描述 */
.logs-header__description {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: var(--text-sm);
  max-width: 60ch;
}

/* 空状态图标 */
.empty-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary);
}

/* 工具栏：级别过滤 + 搜索 + 跟随按钮 */
.log-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

/* 级别过滤：胶囊形分段控件 */
.log-toolbar__levels {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface));
}

/* 单个级别按钮 */
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

/* 悬停 */
.level-button:hover {
  color: var(--app-text-color, var(--ink));
}

/* 选中级别：白底 + 阴影凸起 */
.level-button--active {
  background: var(--bg);
  color: var(--app-text-color, var(--ink));
  box-shadow: var(--shadow-sm);
}

/* 搜索框包裹：相对定位放图标 */
.log-toolbar__search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 12rem;
}

/* 搜索图标：绝对定位在左侧 */
.log-toolbar__search-icon {
  position: absolute;
  left: var(--space-3);
  width: 1rem;
  height: 1rem;
  color: var(--muted);
  pointer-events: none;
}

/* 搜索输入框：左侧留出图标空间 */
.log-toolbar__search-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3) 0 2.25rem;
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

/* 搜索占位文字 */
.log-toolbar__search-input::placeholder {
  color: var(--placeholder);
}

/* 日志面板：毛玻璃卡片 */
.log-panel {
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  padding: var(--space-4);
}

/* 日志流：限制最大高度，内部滚动 */
.log-stream {
  max-height: min(32rem, 65dvh);
  overflow-y: auto;
}

/* “加载更早”按钮：通栏 */
.log-stream__older {
  width: 100%;
  margin-bottom: var(--space-2);
}

/* 日志行列表 */
.log-stream__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* 单行日志：时间 / 级别 / 模块 / 消息 四列网格 */
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

/* 行悬停：浅色底便于定位 */
.log-line:hover {
  background: var(--app-area-bg, var(--bg));
}

/* 错误行：底色与文字色由日志配色设置控制 */
.log-line--error {
  background: var(--log-error-bg, transparent);
  color: var(--log-error-color, var(--danger));
}

/* 错误行所有文字统一用错误色 */
.log-line--error .log-line__time,
.log-line--error .log-line__level,
.log-line--error .log-line__module,
.log-line--error .log-line__message {
  color: var(--log-error-color, var(--danger));
}

/* 警告行 */
.log-line--warning {
  background: var(--log-warn-bg, transparent);
  color: var(--log-warn-color, var(--warning-text));
}

/* 警告行所有文字统一用警告色 */
.log-line--warning .log-line__time,
.log-line--warning .log-line__level,
.log-line--warning .log-line__module,
.log-line--warning .log-line__message {
  color: var(--log-warn-color, var(--warning-text));
}

/* 信息行 */
.log-line--info {
  background: var(--log-info-bg, transparent);
}

/* 信息行文字跟随自定义颜色 */
.log-line--info .log-line__time,
.log-line--info .log-line__module,
.log-line--info .log-line__message {
  color: var(--log-info-color, inherit);
}

/* 调试行 */
.log-line--debug {
  background: var(--log-debug-bg, transparent);
}

/* 调试行文字跟随自定义颜色 */
.log-line--debug .log-line__time,
.log-line--debug .log-line__module,
.log-line--debug .log-line__message {
  color: var(--log-debug-color, inherit);
}

/* 时间：弱化 + 等宽数字 */
.log-line__time {
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

/* 级别文字：加粗 */
.log-line__level {
  font-weight: 600;
}

/* 级别颜色：信息主色 */
.log-line__level--info {
  color: var(--primary);
}

/* 级别颜色：警告 */
.log-line__level--warning {
  color: var(--warning);
}

/* 级别颜色：错误 */
.log-line__level--danger {
  color: var(--danger);
}

/* 级别颜色：中性 */
.log-line__level--neutral {
  color: var(--muted);
}

/* 模块名：次要色，超长省略 */
.log-line__module {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 消息：保留换行，长词可断 */
.log-line__message {
  min-width: 0;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 折叠态：超长消息省略为一行，可点击 */
.log-line__message--collapsed {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}


/* 窄屏：隐藏模块列 */
@media (max-width: 640px) {
  .log-line {
    grid-template-columns: auto 3rem minmax(0, 1fr);
  }

  .log-line__module {
    display: none;
  }
}
</style>
