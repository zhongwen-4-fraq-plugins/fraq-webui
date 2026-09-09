<script setup>
import { computed, onMounted, ref } from 'vue'
import IconBlocks from '~icons/tabler/blocks'
import IconExternalLink from '~icons/tabler/external-link'
import IconPlayerPlay from '~icons/tabler/player-play'
import IconPlus from '~icons/tabler/plus'
import IconSearch from '~icons/tabler/search'
import IconSettings from '~icons/tabler/settings'
import IconSquare from '~icons/tabler/square'
import IconTrash from '~icons/tabler/trash'
import { store } from '../services/store.js'
import { sortPlugins } from '../data/plugins.js'
import { categoryLabel, filterStorePlugins, isInstalled } from '../data/storePlugins.js'
import { PLUGIN_STATUS } from '../models/plugin.js'
import AppButton from '../components/AppButton.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorBanner from '../components/ErrorBanner.vue'
import PageHeader from '../components/PageHeader.vue'
import PluginConfigDialog from '../components/PluginConfigDialog.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import StatusBadge from '../components/StatusBadge.vue'

onMounted(() => {
  store.refreshPlugins()
  store.refreshStorePlugins()
})

const sortedPlugins = computed(() => sortPlugins(store.state.plugins))
const localFilter = ref('all')
const enabledPluginCount = computed(() => sortedPlugins.value.filter((plugin) => plugin.enabled).length)
const disabledPluginCount = computed(() => sortedPlugins.value.length - enabledPluginCount.value)
const visiblePlugins = computed(() => {
  if (localFilter.value === 'enabled') {
    return sortedPlugins.value.filter((plugin) => plugin.enabled)
  }
  if (localFilter.value === 'disabled') {
    return sortedPlugins.value.filter((plugin) => !plugin.enabled)
  }
  return sortedPlugins.value
})

const statusMeta = (plugin) => {
  if (!plugin.enabled) return { tone: 'neutral', label: '已停用' }
  if (plugin.status === PLUGIN_STATUS.error) return { tone: 'danger', label: '异常' }
  if (plugin.status === PLUGIN_STATUS.running) return { tone: 'success', label: '运行中' }
  return { tone: 'neutral', label: '等待核心启动' }
}

const installOpen = ref(false)
const installName = ref('')
const installError = ref('')
const installVersion = ref('')

function openInstall() {
  installName.value = ''
  installError.value = ''
  installOpen.value = true
}

async function confirmInstall() {
  const name = installName.value.trim()
  if (!name) {
    installError.value = '请输入插件名称'
    return
  }
  if (!/^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9-]*$/i.test(name)) {
    installError.value = '插件名称格式不正确，例如 @fraqjs/plugin-hono'
    return
  }
  installError.value = ''
  installOpen.value = false
  try {
    await store.installPlugin(name, installVersion.value)
  } catch (error) {
    store.toast('error', error instanceof Error ? error.message : '安装失败')
  }
  installVersion.value = ''
}

const uninstallTarget = ref(null)
const uninstallOpen = ref(false)
const configTarget = ref(null)
const configOpen = ref(false)

function openConfig(plugin) {
  configTarget.value = plugin
  configOpen.value = true
}

function openUninstall(plugin) {
  uninstallTarget.value = plugin
  uninstallOpen.value = true
}

function confirmUninstall() {
  const plugin = uninstallTarget.value
  uninstallOpen.value = false
  if (plugin) {
    store.uninstallPlugin(plugin.id)
  }
}

const isBusy = (id) => store.state.busyPlugins.includes(id)

const view = ref('local')

const storeQuery = ref('')
const filteredStorePlugins = computed(() => filterStorePlugins(store.state.storePlugins, storeQuery.value))

function installFromStore(plugin) {
  installName.value = plugin.name
  installVersion.value = plugin.version ?? ''
  installError.value = ''
  installOpen.value = true
}
</script>

<template>
  <div>
    <PageHeader
      title="插件"
      description="管理本地已安装的插件，包括暂时停用的插件。"
    >
      <template #action>
        <AppButton v-if="view === 'local'" @click="openInstall">
          <IconPlus aria-hidden="true" />
          安装插件
        </AppButton>
      </template>
    </PageHeader>

    <div class="source-tabs" role="group" aria-label="插件来源">
      <button
        type="button"
        class="source-tab"
        :class="{ 'source-tab--active': view === 'local' }"
        :aria-pressed="view === 'local'"
        @click="view = 'local'"
      >
        本地插件
        <span class="source-tab__count">{{ store.state.plugins.length }}</span>
      </button>
      <button
        type="button"
        class="source-tab"
        :class="{ 'source-tab--active': view === 'store' }"
        :aria-pressed="view === 'store'"
        @click="view = 'store'"
      >
        插件商店
      </button>
    </div>

    <template v-if="view === 'local'">
      <ErrorBanner
        v-if="store.state.errors.plugins"
        :message="store.state.errors.plugins"
        @retry="store.refreshPlugins"
      />

      <SkeletonBlock v-if="store.state.loading.plugins" :lines="5" />

      <EmptyState
        v-else-if="sortedPlugins.length === 0"
        title="还没有本地插件"
        description="安装第一个插件后，它会显示在这里。"
      >
        <template #icon>
          <IconBlocks class="empty-icon" aria-hidden="true" />
        </template>
        <template #action>
          <AppButton @click="openInstall">
            <IconPlus aria-hidden="true" />
            安装插件
          </AppButton>
        </template>
      </EmptyState>

      <template v-else>
        <div class="plugin-toolbar" aria-label="插件状态筛选">
          <button
            type="button"
            class="plugin-filter"
            :class="{ 'plugin-filter--active': localFilter === 'all' }"
            :aria-pressed="localFilter === 'all'"
            @click="localFilter = 'all'"
          >
            全部
            <span class="plugin-filter__count">{{ sortedPlugins.length }}</span>
          </button>
          <button
            type="button"
            class="plugin-filter"
            :class="{ 'plugin-filter--active': localFilter === 'enabled' }"
            :aria-pressed="localFilter === 'enabled'"
            @click="localFilter = 'enabled'"
          >
            已启用
            <span class="plugin-filter__count">{{ enabledPluginCount }}</span>
          </button>
          <button
            type="button"
            class="plugin-filter"
            :class="{ 'plugin-filter--active': localFilter === 'disabled' }"
            :aria-pressed="localFilter === 'disabled'"
            @click="localFilter = 'disabled'"
          >
            已停用
            <span class="plugin-filter__count">{{ disabledPluginCount }}</span>
          </button>
        </div>

        <EmptyState
          v-if="visiblePlugins.length === 0"
          title="没有符合条件的插件"
          description="切换筛选条件，或启用列表中的停用插件。"
        >
          <template #icon>
            <IconBlocks class="empty-icon" aria-hidden="true" />
          </template>
        </EmptyState>

        <div v-else class="plugin-list">
        <div class="plugin-list__head" aria-hidden="true">
          <span>插件</span>
          <span>状态</span>
          <span>操作</span>
        </div>

        <ul class="plugin-list__body">
          <li v-for="plugin in visiblePlugins" :key="plugin.id" class="plugin-row">
            <div class="plugin-row__info">
              <p class="plugin-row__name">
                {{ plugin.name }}
                <span class="plugin-row__version">v{{ plugin.version }}</span>
              </p>
              <p class="plugin-row__description">{{ plugin.description }}</p>
            </div>
            <StatusBadge :tone="statusMeta(plugin).tone">
              {{ statusMeta(plugin).label }}
            </StatusBadge>
            <div class="plugin-row__actions">
              <AppButton
                v-if="plugin.enabled"
                variant="secondary"
                size="icon"
                :aria-label="`配置 ${plugin.name}`"
                title="配置"
                @click="openConfig(plugin)"
              >
                <IconSettings aria-hidden="true" />
              </AppButton>
              <AppButton
                v-if="!plugin.enabled"
                variant="secondary"
                size="icon"
                :loading="isBusy(plugin.id)"
                :aria-label="`启用 ${plugin.name}`"
                title="启用"
                @click="store.setPluginEnabled(plugin.id, true)"
              >
                <IconPlayerPlay aria-hidden="true" />
              </AppButton>
              <AppButton
                v-else
                variant="secondary"
                size="icon"
                :loading="isBusy(plugin.id)"
                :aria-label="`停用 ${plugin.name}`"
                title="停用"
                @click="store.setPluginEnabled(plugin.id, false)"
              >
                <IconSquare aria-hidden="true" />
              </AppButton>
              <AppButton
                variant="danger-ghost"
                size="icon"
                :loading="isBusy(plugin.id)"
                :aria-label="`卸载 ${plugin.name}`"
                title="卸载"
                @click="openUninstall(plugin)"
              >
                <IconTrash aria-hidden="true" />
              </AppButton>
            </div>
          </li>
        </ul>
      </div>
      </template>
    </template>

    <section v-else class="store" aria-labelledby="store-heading">
      <div class="store__toolbar">
        <div class="store__search">
          <IconSearch class="store__search-icon" aria-hidden="true" />
          <input
            v-model="storeQuery"
            type="search"
            class="store__search-input"
            placeholder="搜索插件名称、描述或分类"
            aria-label="搜索商店插件"
          />
        </div>
        <span class="store__count">共 {{ filteredStorePlugins.length }} 个插件</span>
        <AppButton variant="ghost" size="sm" href="https://fraq.dev/plugins" target="_blank">
          官方商店
          <IconExternalLink aria-hidden="true" />
        </AppButton>
      </div>

      <ErrorBanner
        v-if="store.state.errors.storePlugins"
        :message="store.state.errors.storePlugins"
        @retry="store.refreshStorePlugins"
      />

      <SkeletonBlock v-if="store.state.loading.storePlugins" :lines="6" />

      <EmptyState
        v-else-if="filteredStorePlugins.length === 0"
        title="没有找到插件"
        description="换个关键词试试，或前往官方商店浏览全部插件。"
      >
        <template #icon>
          <IconBlocks class="empty-icon" aria-hidden="true" />
        </template>
        <template #action>
          <AppButton href="https://fraq.dev/plugins" target="_blank">
            前往插件商店
            <IconExternalLink aria-hidden="true" />
          </AppButton>
        </template>
      </EmptyState>

      <ul v-else class="store-list">
        <li v-for="plugin in filteredStorePlugins" :key="plugin.id" class="store-row">
          <div class="store-row__info">
            <p class="store-row__name">
              {{ plugin.name }}
              <span class="store-row__version">v{{ plugin.version }}</span>
            </p>
            <p class="store-row__description">{{ plugin.description }}</p>
          </div>
          <div class="store-row__meta">
            <StatusBadge tone="neutral">{{ categoryLabel(plugin.category) }}</StatusBadge>
          </div>
          <div class="store-row__actions">
            <StatusBadge v-if="isInstalled(store.state.plugins, plugin)" tone="success">已安装</StatusBadge>
            <AppButton
              v-else
              variant="secondary"
              size="icon"
              :aria-label="`安装 ${plugin.name}`"
              title="安装"
              @click="installFromStore(plugin)"
            >
              <IconPlus aria-hidden="true" />
            </AppButton>
            <AppButton
              v-if="plugin.repository"
              variant="ghost"
              size="icon"
              :href="plugin.repository"
              target="_blank"
              :aria-label="`查看 ${plugin.name} 源码`"
              title="查看源码"
            >
              <IconExternalLink aria-hidden="true" />
            </AppButton>
          </div>
        </li>
      </ul>
    </section>

    <ConfirmDialog
      v-model:open="installOpen"
      title="安装插件"
      confirm-label="安装"
      @confirm="confirmInstall"
    >
      <label class="install-field" for="plugin-name">插件名称</label>
      <input
        id="plugin-name"
        v-model="installName"
        class="install-input"
        type="text"
        placeholder="例如 fraq-plugin-ai"
        autocomplete="off"
        @keydown.enter="confirmInstall"
      />
      <p v-if="installError" class="install-error">{{ installError }}</p>
      <p class="install-hint">会自动解析并安装所需的依赖插件；安装后插件处于停用状态，需要手动启用。</p>
    </ConfirmDialog>

    <ConfirmDialog
      v-model:open="uninstallOpen"
      :title="`卸载插件 ${uninstallTarget?.name ?? ''}？`"
      confirm-label="卸载插件"
      cancel-label="保留插件"
      danger
      @confirm="confirmUninstall"
    >
      卸载会移除插件及其数据，且无法恢复。请先停用插件再卸载。
    </ConfirmDialog>

    <PluginConfigDialog v-model:open="configOpen" :plugin="configTarget" />
  </div>
</template>

<style scoped>
/* 来源切换（本地/商店）：胶囊形分段控件 */
.source-tabs {
  display: inline-flex;
  padding: 2px; /* 内边距形成分段底色 */
  margin-bottom: var(--space-4); /* 与列表间距 */
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface)); /* 分段底色 */
}

/* 单个来源按钮 */
.source-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted); /* 未选中：次要色 */
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
}

/* 悬停：文字变正文色 */
.source-tab:hover {
  color: var(--app-text-color, var(--ink));
}

/* 选中：主色 + 加粗 */
.source-tab--active {
  background: transparent;
  color: var(--primary); /* 高亮主色 */
  font-weight: 600;
}

/* 本地插件数量徽标 */
.source-tab__count {
  padding: 0 6px;
  border-radius: 999px; /* 胶囊形 */
  background: var(--primary-soft); /* 主色浅底 */
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums; /* 数字对齐 */
}

/* 本地插件状态筛选：与来源切换保持同一组控件语言。 */
.plugin-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
}

.plugin-filter {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 2rem;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--muted);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
}

.plugin-filter:hover {
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
}

.plugin-filter--active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.plugin-filter__count {
  font-variant-numeric: tabular-nums;
}

/* 商店区：纵向排列 */
.store {
  display: flex;
  flex-direction: column;
  gap: var(--space-4); /* 区块间距 */
}

/* 商店工具栏：搜索 + 计数 + 官方商店链接 */
.store__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

/* 搜索框包裹：相对定位放图标 */
.store__search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 12rem; /* 窄屏不缩得太小 */
}

/* 搜索图标：绝对定位在左侧 */
.store__search-icon {
  position: absolute;
  left: var(--space-3);
  width: 1rem;
  height: 1rem;
  color: var(--muted);
  pointer-events: none; /* 点击穿透 */
}

/* 搜索输入框：左侧留出图标空间 */
.store__search-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3) 0 2.25rem; /* 左 36px 放图标 */
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

/* 搜索占位文字颜色 */
.store__search-input::placeholder {
  color: var(--placeholder);
}

/* 安装输入框占位文字 */
.install-input::placeholder {
  color: var(--placeholder);
}

/* 插件计数 */
.store__count {
  color: var(--muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

/* 商店列表：毛玻璃卡片，裁掉圆角外的内容 */
.store-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  overflow: hidden; /* 配合圆角裁边 */
}

/* 商店行：信息 + 分类 + 操作三列 */
.store-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4);
  background: var(--app-area-bg, var(--bg)); /* 行底色 */
}

/* 插件名：允许长名换行 */
.store-row__name {
  font-size: var(--text-sm);
  font-weight: 600;
  word-break: break-all; /* 长包名可断行 */
}

/* 插件描述：最多两行省略 */
.store-row__description {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--text-xs);
  display: -webkit-box; /* 两行截断需要 webkit box */
  -webkit-line-clamp: 2; /* 最多两行 */
  -webkit-box-orient: vertical;
  overflow: hidden; /* 超出省略 */
}

/* 分类列：右对齐 */
.store-row__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* 靠右 */
  gap: var(--space-1);
}

/* 版本号：等宽弱化 */
.store-row__version {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--faint); /* 弱化 */
  font-weight: 400;
}

/* 操作列 */
.store-row__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* 窄屏：商店行改为两列，操作按钮独占一行 */
@media (max-width: 720px) {
  .store-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .store-row__actions {
    grid-column: 1 / -1; /* 跨整行 */
  }
}

/* 空状态图标 */
.empty-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary); /* 主色 */
}

/* 本地插件列表：毛玻璃卡片 */
.plugin-list {
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  overflow: hidden; /* 配合圆角裁边 */
}

/* 表头与行共用同一套列宽，保证标注与内容对齐 */
.plugin-list__head,
.plugin-row {
  display: grid;
  /* 表头与行共用同一套列宽，保证标注与内容对齐 */
  grid-template-columns: minmax(0, 1fr) 4.5rem 8rem; /* 信息 / 状态 / 操作 */
  gap: var(--space-4);
  align-items: center;
}

/* 表头 */
.plugin-list__head {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  color: var(--muted);
  font-size: var(--text-xs);
}

/* 状态标注与徽标文字对齐（跳过圆点） */
.plugin-list__head span:nth-child(2) {
  padding-left: calc(0.5rem + var(--space-1));
}

/* 操作标注居中于两个按钮之间 */
.plugin-list__head span:nth-child(3) {
  text-align: center;
}

/* 行内容 */
.plugin-list__body {
  margin: 0;
  padding: 0;
  list-style: none; /* 去掉默认圆点 */
}

/* 插件行：底色与列表区分 */
.plugin-row {
  padding: var(--space-4);
  background: var(--app-area-bg, var(--bg));
}

/* 插件名 */
.plugin-row__name {
  font-size: var(--text-sm);
  font-weight: 600;
}

/* 插件描述：超长省略为一行 */
.plugin-row__description {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--text-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* 单行 */
}

/* 插件版本号 */
.plugin-row__version {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--faint); /* 弱化 */
  font-weight: 400;
}

/* 行内操作按钮组 */
.plugin-row__actions {
  display: flex;
  gap: var(--space-2);
}

/* 安装弹窗字段标签 */
.install-field {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* 安装弹窗输入框 */
.install-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2)); /* 组件底色 */
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

/* 输入框占位文字 */
.install-input::placeholder {
  color: var(--muted);
}

/* 安装错误提示 */
.install-error {
  margin-top: var(--space-2);
  color: var(--danger); /* 危险色 */
  font-size: var(--text-xs);
}

/* 安装提示文字 */
.install-hint {
  margin-top: var(--space-2);
  color: var(--muted); /* 次要文字色 */
  font-size: var(--text-xs);
}

/* 窄屏：隐藏表头，行改为两列，操作独占一行 */
@media (max-width: 720px) {
  .plugin-list__head {
    display: none; /* 表头在窄屏不适用 */
  }

  .plugin-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-3);
  }

  .plugin-row__actions {
    grid-column: 1 / -1; /* 跨整行 */
  }
}
</style>
