<script setup>
import { computed, h, onMounted, ref } from 'vue'
import {
  NButton,
  NButtonGroup,
  NDataTable,
  NIcon,
  NInput,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui'
import {
  ExternalLink,
  PlayerPlay,
  Plus,
  Search,
  Settings,
  Square,
  Trash,
} from '@vicons/tabler'
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

const statusMeta = (status) => {
  if (status === PLUGIN_STATUS.running) return { tone: 'success', label: '运行中' }
  if (status === PLUGIN_STATUS.error) return { tone: 'danger', label: '异常' }
  return { tone: 'neutral', label: '已停用' }
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

function renderPluginCell(row) {
  return h('div', { class: 'plugin-cell' }, [
    h('p', { class: 'plugin-cell__name' }, [
      row.name,
      h('span', { class: 'plugin-cell__version' }, `v${row.version}`),
    ]),
    h('p', { class: 'plugin-cell__description' }, row.description),
  ])
}

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

function actionButton({ icon, label, loading, danger, onClick }) {
  return h(
    NButton,
    {
      size: 'small',
      quaternary: true,
      type: danger ? 'error' : 'default',
      loading,
      'aria-label': label,
      title: label,
      onClick,
    },
    { icon: renderIcon(icon) },
  )
}

const localColumns = [
  {
    title: '插件',
    key: 'name',
    minWidth: 220,
    render: renderPluginCell,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const meta = statusMeta(row.status)
      return h(StatusBadge, { tone: meta.tone }, { default: () => meta.label })
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 148,
    render: (row) =>
      h(NButtonGroup, null, {
        default: () => [
          actionButton({
            icon: Settings,
            label: `配置 ${row.name}`,
            onClick: () => openConfig(row),
          }),
          row.status === PLUGIN_STATUS.running
            ? actionButton({
                icon: Square,
                label: `停用 ${row.name}`,
                loading: isBusy(row.id),
                onClick: () => store.setPluginEnabled(row.id, false),
              })
            : actionButton({
                icon: PlayerPlay,
                label: `启用 ${row.name}`,
                loading: isBusy(row.id),
                onClick: () => store.setPluginEnabled(row.id, true),
              }),
          actionButton({
            icon: Trash,
            label: `卸载 ${row.name}`,
            danger: true,
            loading: isBusy(row.id),
            onClick: () => openUninstall(row),
          }),
        ],
      }),
  },
]

const storeColumns = [
  {
    title: '插件',
    key: 'name',
    minWidth: 220,
    render: renderPluginCell,
  },
  {
    title: '分类',
    key: 'category',
    width: 110,
    render: (row) => h(NTag, { size: 'small', bordered: false }, { default: () => categoryLabel(row.category) }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 132,
    render: (row) => {
      if (isInstalled(store.state.plugins, row)) {
        return h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => '已安装' })
      }
      return h(NButtonGroup, null, {
        default: () => [
          actionButton({
            icon: Plus,
            label: `安装 ${row.name}`,
            onClick: () => installFromStore(row),
          }),
          row.repository
            ? h(
                NButton,
                {
                  size: 'small',
                  quaternary: true,
                  tag: 'a',
                  href: row.repository,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  'aria-label': `查看 ${row.name} 源码`,
                  title: '查看源码',
                },
                { icon: renderIcon(ExternalLink) },
              )
            : null,
        ],
      })
    },
  },
]
</script>

<template>
  <div>
    <PageHeader
      title="插件"
      description="管理本地已安装的插件，或前往官方商店发现新插件。"
    >
      <template #action>
        <AppButton v-if="view === 'local'" @click="openInstall">
          <NIcon><Plus /></NIcon>
          安装插件
        </AppButton>
      </template>
    </PageHeader>

    <NTabs v-model:value="view" type="segment" class="source-tabs" :pane-style="{ paddingTop: '16px' }">
      <NTabPane name="local" tab="本地插件">
        <template #default>
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
            <template #action>
              <AppButton @click="openInstall">
                <NIcon><Plus /></NIcon>
                安装插件
              </AppButton>
            </template>
          </EmptyState>

          <NDataTable
            v-else
            :columns="localColumns"
            :data="sortedPlugins"
            :row-key="(row) => row.id"
            :bordered="false"
            :single-line="false"
            class="plugin-table"
          />
        </template>
      </NTabPane>

      <NTabPane name="store" tab="插件商店">
        <template #default>
          <div class="store__toolbar">
            <NInput
              v-model:value="storeQuery"
              class="store__search"
              placeholder="搜索插件名称、描述或分类"
              clearable
              aria-label="搜索商店插件"
            >
              <template #prefix>
                <NIcon size="16"><Search /></NIcon>
              </template>
            </NInput>
            <span class="store__count">共 {{ filteredStorePlugins.length }} 个插件</span>
            <AppButton variant="ghost" size="sm" href="https://fraq.dev/plugins" target="_blank">
              官方商店
              <NIcon><ExternalLink /></NIcon>
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
            <template #action>
              <AppButton href="https://fraq.dev/plugins" target="_blank">
                前往插件商店
                <NIcon><ExternalLink /></NIcon>
              </AppButton>
            </template>
          </EmptyState>

          <NDataTable
            v-else
            :columns="storeColumns"
            :data="filteredStorePlugins"
            :row-key="(row) => row.id"
            :bordered="false"
            :single-line="false"
            class="plugin-table"
          />
        </template>
      </NTabPane>
    </NTabs>

    <ConfirmDialog
      v-model:open="installOpen"
      title="安装插件"
      confirm-label="安装"
      @confirm="confirmInstall"
    >
      <label class="install-field" for="plugin-name">插件名称</label>
      <NInput
        id="plugin-name"
        v-model:value="installName"
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
.source-tabs {
  margin-bottom: var(--space-1);
}

.plugin-table {
  --n-color: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.plugin-cell__name {
  font-size: var(--text-sm);
  font-weight: 600;
  word-break: break-all;
}

.plugin-cell__description {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--text-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-cell__version {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--faint);
  font-weight: 400;
}

.store__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.store__search {
  flex: 1;
  min-width: 12rem;
}

.store__count {
  color: var(--muted);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.install-field {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
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
</style>
