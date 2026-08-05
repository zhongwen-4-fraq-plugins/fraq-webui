<script setup>
import { computed, onMounted, ref } from 'vue'
import { Blocks, Play, Plus, Square, Trash2 } from '@lucide/vue'
import { store } from '../services/store.js'
import { sortPlugins } from '../data/plugins.js'
import { PLUGIN_STATUS } from '../models/plugin.js'
import AppButton from '../components/AppButton.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorBanner from '../components/ErrorBanner.vue'
import PageHeader from '../components/PageHeader.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import StatusBadge from '../components/StatusBadge.vue'

onMounted(() => store.refreshPlugins())

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
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(name)) {
    installError.value = '插件名称只能包含字母、数字和短横线'
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
</script>

<template>
  <div>
    <PageHeader
      title="插件"
      description="管理 fraq 实例上安装的插件：启动、停用或卸载。"
    >
      <template #action>
        <AppButton @click="openInstall">
          <Plus aria-hidden="true" />
          安装插件
        </AppButton>
      </template>
    </PageHeader>

    <ErrorBanner
      v-if="store.state.errors.plugins"
      :message="store.state.errors.plugins"
      @retry="store.refreshPlugins"
    />

    <SkeletonBlock v-if="store.state.loading.plugins" :lines="5" />

    <EmptyState
      v-else-if="sortedPlugins.length === 0"
      title="还没有插件"
      description="安装第一个插件后，它会显示在这里。"
    >
      <template #icon>
        <Blocks class="empty-icon" aria-hidden="true" />
      </template>
      <template #action>
        <AppButton @click="openInstall">
          <Plus aria-hidden="true" />
          安装插件
        </AppButton>
      </template>
    </EmptyState>

    <div v-else class="plugin-list">
      <div class="plugin-list__head" aria-hidden="true">
        <span>插件</span>
        <span>版本</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      <ul class="plugin-list__body">
        <li v-for="plugin in sortedPlugins" :key="plugin.id" class="plugin-row">
          <div class="plugin-row__info">
            <p class="plugin-row__name">{{ plugin.name }}</p>
            <p class="plugin-row__description">{{ plugin.description }}</p>
          </div>
          <span class="plugin-row__version">{{ plugin.version }}</span>
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
              <Play aria-hidden="true" />
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
              <Square aria-hidden="true" />
            </AppButton>
            <AppButton
              variant="danger-ghost"
              size="icon"
              :loading="isBusy(plugin.id)"
              :aria-label="`卸载 ${plugin.name}`"
              title="卸载"
              @click="openUninstall(plugin)"
            >
              <Trash2 aria-hidden="true" />
            </AppButton>
          </div>
        </li>
      </ul>
    </div>

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
.empty-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--primary);
}

.plugin-list {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  overflow: hidden;
}

.plugin-list__head,
.plugin-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
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
  border-top: 1px solid var(--border);
  background: var(--bg);
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
  color: var(--muted);
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
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
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

  .plugin-row__version {
    text-align: right;
  }

  .plugin-row__actions {
    grid-column: 1 / -1;
  }
}
</style>
