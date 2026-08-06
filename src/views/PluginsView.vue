<script setup>
import { computed, onMounted, ref } from 'vue'
import IconBlocks from '~icons/tabler/blocks'
import IconExternalLink from '~icons/tabler/external-link'
import IconPlayerPlay from '~icons/tabler/player-play'
import IconPlus from '~icons/tabler/plus'
import IconSearch from '~icons/tabler/search'
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
import SkeletonBlock from '../components/SkeletonBlock.vue'
import StatusBadge from '../components/StatusBadge.vue'

onMounted(() => {
  store.refreshPlugins()
  store.refreshStorePlugins()
})

const sortedPlugins = computed(() => sortPlugins(store.state.plugins))

const statusMeta = (status) => {
  if (status === PLUGIN_STATUS.running) return { tone: 'success', label: '运行中' }
  if (status === PLUGIN_STATUS.error) return { tone: 'danger', label: '异常' }
  return { tone: 'neutral', label: '已停用' }
}

const installOpen = ref(false)
const installName = ref('')
const installError = ref('')

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
    await store.installPlugin(name)
  } catch (error) {
    store.toast('error', error instanceof Error ? error.message : '安装失败')
  }
}

const uninstallTarget = ref(null)
const uninstallOpen = ref(false)

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
  installError.value = ''
  installOpen.value = true
}
</script>

<template>
  <div>
    <PageHeader
      title="插件"
      description="管理本地已安装的插件，或前往官方商店发现新插件。"
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

      <div v-else class="plugin-list">
        <div class="plugin-list__head" aria-hidden="true">
          <span>插件</span>
          <span>状态</span>
          <span>操作</span>
        </div>

        <ul class="plugin-list__body">
          <li v-for="plugin in sortedPlugins" :key="plugin.id" class="plugin-row">
            <div class="plugin-row__info">
              <p class="plugin-row__name">
                {{ plugin.name }}
                <span class="plugin-row__version">v{{ plugin.version }}</span>
              </p>
              <p class="plugin-row__description">{{ plugin.description }}</p>
            </div>
            <StatusBadge :tone="statusMeta(plugin.status).tone">
              {{ statusMeta(plugin.status).label }}
            </StatusBadge>
            <div class="plugin-row__actions">
              <AppButton
                v-if="plugin.status !== PLUGIN_STATUS.running"
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
      <p class="install-hint">安装后插件处于停用状态，需要手动启用。</p>
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
  </div>
</template>

<style scoped>
.source-tabs {
  display: inline-flex;
  padding: 2px;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.source-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
}

.source-tab:hover {
  color: var(--ink);
}

.source-tab--active {
  background: var(--bg);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}

.source-tab__count {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--ink);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}

.store {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.store__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.store__search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 12rem;
}

.store__search-icon {
  position: absolute;
  left: var(--space-3);
  width: 1rem;
  height: 1rem;
  color: var(--muted);
  pointer-events: none;
}

.store__search-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3) 0 2.25rem;
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--ink);
  font-size: var(--text-sm);
}

.store__search-input::placeholder {
  color: var(--muted);
}

.store__count {
  color: var(--muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.store-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  overflow: hidden;
}

.store-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-4);
  background: var(--app-area-bg, var(--bg));
}

.store-row__name {
  font-size: var(--text-sm);
  font-weight: 600;
  word-break: break-all;
}

.store-row__description {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--text-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.store-row__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.store-row__version {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--faint);
  font-weight: 400;
}

.store-row__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

@media (max-width: 720px) {
  .store-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .store-row__actions {
    grid-column: 1 / -1;
  }
}

.empty-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary);
}

.plugin-list {
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  overflow: hidden;
}

.plugin-list__head,
.plugin-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--space-4);
  align-items: center;
}

.plugin-list__head {
  padding: var(--space-2) var(--space-4);
  background: var(--surface-2);
  color: var(--muted);
  font-size: var(--text-xs);
}

.plugin-list__body {
  margin: 0;
  padding: 0;
  list-style: none;
}

.plugin-row {
  padding: var(--space-4);
  background: var(--app-area-bg, var(--bg));
}

.plugin-row__name {
  font-size: var(--text-sm);
  font-weight: 600;
}

.plugin-row__description {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--text-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-row__version {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--faint);
  font-weight: 400;
}

.plugin-row__actions {
  display: flex;
  gap: var(--space-2);
}

.install-field {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

.install-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--ink);
  font-size: var(--text-sm);
}

.install-input::placeholder {
  color: var(--muted);
}

.install-error {
  margin-top: var(--space-2);
  color: var(--danger);
  font-size: var(--text-xs);
}

.install-hint {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: var(--text-xs);
}

@media (max-width: 720px) {
  .plugin-list__head {
    display: none;
  }

  .plugin-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-3);
  }

  .plugin-row__actions {
    grid-column: 1 / -1;
  }
}
</style>
