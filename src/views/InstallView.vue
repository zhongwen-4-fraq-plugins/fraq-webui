<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  NCard,
  NIcon,
  NInput,
  NProgress,
  NRadio,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
} from 'naive-ui'
import {
  ArrowUp,
  BrandGithub,
  Download,
  Folder,
  PlayerPlay,
  PlayerStop,
  Refresh,
} from '@vicons/tabler'
import { httpApi } from '../services/httpApi.js'
import { formatBytes, formatDate } from '../data/format.js'
import AppButton from '../components/AppButton.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ErrorBanner from '../components/ErrorBanner.vue'
import PageHeader from '../components/PageHeader.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'
import StatusBadge from '../components/StatusBadge.vue'

const sources = [
  { id: 'yogurt', label: 'Yogurt', repo: 'SaltifyDev/yogurt-releases' },
  { id: 'lucky', label: 'LuckyLilliaBot', repo: 'LLOneBot/LuckyLilliaBot' },
]

const checking = ref(true)
const checkError = ref('')
const cli = reactive({ installed: false, version: '' })
const node = reactive({ installed: false, nodeVersion: '', npmVersion: '' })
const protocol = reactive({ reachable: false, running: false, detail: '' })

const source = ref('yogurt')
const releases = ref([])
const releasesLoading = ref(false)
const releaseError = ref('')
const tag = ref('')
const assetName = ref('')
const protocolDir = ref('')

const status = reactive({
  busy: false,
  phase: 'idle',
  progress: 0,
  message: '',
  error: '',
  exePath: '',
  task: '',
  running: false,
  pid: null,
})

const installingCli = ref(false)
const nodeInstalling = ref(false)
const downloading = ref(false)
const starting = ref(false)
const stopping = ref(false)

const nodeReleases = ref([])
const nodeReleasesLoading = ref(false)
const nodeReleaseError = ref('')
const nodeTag = ref('')

const dirOpen = ref(false)
const dirPath = ref('')
const dirParent = ref('')
const dirs = ref([])
const dirLoading = ref(false)
const dirError = ref('')
const picking = ref(false)

let pollTimer = null

const currentRelease = computed(
  () => releases.value.find((item) => item.tag === tag.value) ?? null,
)

const cliBusy = computed(() => status.phase === 'installing-cli')
const nodeBusy = computed(
  () => status.task === 'node' && ['downloading', 'extracting'].includes(status.phase),
)
const protocolBusy = computed(
  () => status.task === 'protocol' && ['downloading', 'extracting'].includes(status.phase),
)
const busyPhase = computed(() => cliBusy.value || nodeBusy.value || protocolBusy.value)

function isRecommended(asset) {
  const name = asset.name.toLowerCase()
  return (
    name.endsWith('.zip') &&
    /(windows|-win|^win)/.test(name) &&
    (name.includes('x64') || name.includes('amd64'))
  )
}

watch(currentRelease, (release) => {
  if (!release) return
  const recommended =
    release.assets.find(isRecommended) ??
    release.assets.find((asset) => asset.name.toLowerCase().endsWith('.zip')) ??
    release.assets[0]
  assetName.value = recommended?.name ?? ''
})

watch(source, async () => {
  tag.value = ''
  assetName.value = ''
  releases.value = []
  releaseError.value = ''
  await loadReleases()
})

async function loadReleases() {
  releasesLoading.value = true
  releaseError.value = ''
  try {
    const result = await httpApi.getProtocolReleases(source.value)
    releases.value = result.releases
    tag.value = releases.value[0]?.tag ?? ''
    if (releases.value.length === 0) {
      releaseError.value = '该仓库暂无发布版本'
    }
  } catch (error) {
    releaseError.value = error instanceof Error ? error.message : '无法获取版本列表'
  } finally {
    releasesLoading.value = false
  }
}

async function loadNodeReleases() {
  nodeReleasesLoading.value = true
  nodeReleaseError.value = ''
  try {
    const result = await httpApi.getNodeReleases()
    nodeReleases.value = result.releases
    nodeTag.value = nodeReleases.value[0]?.version ?? ''
    if (nodeReleases.value.length === 0) {
      nodeReleaseError.value = '暂无可用版本'
    }
  } catch (error) {
    nodeReleaseError.value = error instanceof Error ? error.message : '无法获取版本列表'
  } finally {
    nodeReleasesLoading.value = false
  }
}

async function loadDirs(dir) {
  dirLoading.value = true
  dirError.value = ''
  try {
    const result = await httpApi.getDirList(dir)
    dirPath.value = result.path
    dirParent.value = result.parent
    dirs.value = result.dirs
  } catch (error) {
    dirError.value = error instanceof Error ? error.message : '无法读取目录'
  } finally {
    dirLoading.value = false
  }
}

function openDirPicker() {
  dirOpen.value = true
  loadDirs(protocolDir.value || '')
}

// 优先弹出系统原生文件夹选择器，不可用时回退到页面内目录浏览
async function pickDir() {
  if (picking.value) return
  picking.value = true
  try {
    const result = await httpApi.pickDirectory()
    if (result.picked && result.path) {
      protocolDir.value = result.path
    }
  } catch {
    openDirPicker()
  } finally {
    picking.value = false
  }
}

function applyDir() {
  if (!dirPath.value) return
  protocolDir.value = dirPath.value
  dirOpen.value = false
}

async function refreshCheck() {
  checking.value = true
  checkError.value = ''
  try {
    const result = await httpApi.getInstallCheck()
    cli.installed = result.cli.installed
    cli.version = result.cli.version
    node.installed = result.node.installed
    node.nodeVersion = result.node.nodeVersion
    node.npmVersion = result.node.npmVersion
    protocol.reachable = result.protocol.reachable
    protocol.running = result.protocol.running === true
    protocol.detail = result.protocol.detail
    Object.assign(status, result.status)
  } catch (error) {
    checkError.value = error instanceof Error ? error.message : '环境检查失败'
  } finally {
    checking.value = false
  }
}

async function refreshStatus() {
  try {
    const result = await httpApi.getInstallStatus()
    Object.assign(status, result)
    protocolDir.value = result.protocolDir ?? ''
  } catch {
    // 轮询失败时保持上次状态，下次继续
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    await refreshStatus()
    if (!busyPhase.value && !downloading.value && !installingCli.value) {
      stopPolling()
      await refreshCheck()
    }
  }, 1200)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function installCli() {
  installingCli.value = true
  status.phase = 'installing-cli'
  try {
    await httpApi.installCli()
    startPolling()
  } catch (error) {
    status.error = error instanceof Error ? error.message : '安装失败'
  } finally {
    installingCli.value = false
  }
}

async function installNode() {
  if (!nodeTag.value) return
  nodeInstalling.value = true
  status.error = ''
  try {
    await httpApi.installNode({
      version: nodeTag.value,
      installDir: protocolDir.value,
    })
    startPolling()
  } catch (error) {
    status.error = error instanceof Error ? error.message : '安装失败'
  } finally {
    nodeInstalling.value = false
  }
}

async function download() {
  if (!tag.value || !assetName.value) return
  downloading.value = true
  status.error = ''
  try {
    await httpApi.installProtocol({
      source: source.value,
      tag: tag.value,
      asset: assetName.value,
      installDir: protocolDir.value,
    })
    startPolling()
  } catch (error) {
    status.error = error instanceof Error ? error.message : '安装失败'
  } finally {
    downloading.value = false
  }
}

async function startProtocol() {
  starting.value = true
  status.error = ''
  try {
    await httpApi.startProtocol()
    await refreshStatus()
    await refreshCheck()
  } catch (error) {
    status.error = error instanceof Error ? error.message : '启动失败'
  } finally {
    starting.value = false
  }
}

async function stopProtocol() {
  stopping.value = true
  try {
    await httpApi.stopProtocol()
    await refreshStatus()
    await refreshCheck()
  } catch (error) {
    status.error = error instanceof Error ? error.message : '停止失败'
  } finally {
    stopping.value = false
  }
}

onMounted(async () => {
  await refreshCheck()
  await loadNodeReleases()
  await loadReleases()
  await refreshStatus()
  if (busyPhase.value) {
    startPolling()
  }
})

onUnmounted(stopPolling)
</script>

<template>
  <div>
    <PageHeader
      title="安装"
      description="检查并安装 fraq 运行环境：Node.js、fraq CLI 与 Milky 协议端。"
    />

    <ErrorBanner v-if="checkError" :message="checkError" @retry="refreshCheck" />

    <SkeletonBlock v-if="checking" :lines="5" />

    <div v-else class="install">
      <NCard class="app-panel" :bordered="false" size="large">
        <template #header>
          <span class="install__heading">安装目录</span>
        </template>
        <div class="install__dir-row">
          <NInput
            id="install-dir"
            v-model:value="protocolDir"
            placeholder="D:\bot\fraq-webui\protocols"
            autocomplete="off"
            aria-label="安装目录"
          />
          <AppButton variant="secondary" :loading="picking" @click="pickDir">
            <NIcon><Folder /></NIcon>
            {{ picking ? '选择中' : '选择' }}
          </AppButton>
        </div>
        <p class="install__hint">
          Node.js 与协议端的下载解压位置，需为完整路径；留空使用默认目录，修改后自动保存。
        </p>
      </NCard>

      <ConfirmDialog
        v-model:open="dirOpen"
        title="选择安装目录"
        confirm-label="使用此目录"
        @confirm="applyDir"
      >
        <div class="dir-picker">
          <div class="dir-picker__path">
            <span class="dir-picker__path-text">{{ dirPath || '请选择磁盘' }}</span>
            <AppButton
              v-if="dirParent"
              variant="ghost"
              size="sm"
              @click="loadDirs(dirParent)"
            >
              <NIcon><ArrowUp /></NIcon>
              上一级
            </AppButton>
          </div>
          <p v-if="dirError" class="install__error">{{ dirError }}</p>
          <SkeletonBlock v-if="dirLoading" :lines="4" />
          <ul v-else class="dir-picker__list">
            <li v-if="dirs.length === 0" class="dir-picker__empty">
              此目录没有子文件夹，可直接使用
            </li>
            <li v-for="item in dirs" :key="item">
              <AppButton variant="ghost" size="sm" class="dir-picker__item" @click="loadDirs(item)">
                <NIcon><Folder /></NIcon>
                <span>{{ item }}</span>
              </AppButton>
            </li>
          </ul>
        </div>
      </ConfirmDialog>

      <NCard class="app-panel" :bordered="false" size="large">
        <template #header>
          <span class="install__heading">Node.js</span>
        </template>
        <div class="install__row">
          <StatusBadge :tone="node.installed ? 'success' : 'danger'">
            {{ node.installed ? `已安装 ${node.nodeVersion}` : '未检测到' }}
          </StatusBadge>
          <AppButton v-if="node.installed" variant="ghost" size="sm" @click="refreshCheck">
            <NIcon><Refresh /></NIcon>
            重新检查
          </AppButton>
        </div>
        <p v-if="node.installed && node.npmVersion" class="install__hint">
          npm {{ node.npmVersion }}
        </p>
        <p v-else class="install__hint">
          Node.js 是 fraq CLI 与协议端安装的基础；未安装时可选择版本下载安装（便携版，无需管理员权限）。
        </p>

        <template v-if="!node.installed">
          <div class="install__field">
            <label class="install__label" for="node-version">版本</label>
            <NSelect
              id="node-version"
              v-model:value="nodeTag"
              :options="nodeReleases.map((item) => ({
                label: item.lts ? `${item.version}（LTS ${item.lts}）` : item.version,
                value: item.version,
              }))"
              :disabled="nodeReleasesLoading || nodeReleases.length === 0"
              :placeholder="nodeReleasesLoading ? '正在加载版本...' : '选择版本'"
            />
            <p v-if="nodeReleaseError" class="install__error">{{ nodeReleaseError }}</p>
          </div>

          <div class="install__actions">
            <AppButton :loading="nodeInstalling" :disabled="!nodeTag" @click="installNode">
              <NIcon><Download /></NIcon>
              下载并安装
            </AppButton>
          </div>

          <div v-if="nodeBusy" class="install__progress">
            <NProgress
              type="line"
              :percentage="status.progress"
              :show-indicator="false"
              :height="6"
            />
            <span class="install__progress-text" aria-live="polite">
              {{ status.message }}（{{ status.progress }}%）
            </span>
          </div>
          <p v-if="status.task === 'node' && status.phase === 'error'" class="install__error">
            {{ status.error }}
          </p>
          <p
            v-else-if="status.task === 'node' && status.phase === 'done'"
            class="install__hint install__hint--notice"
          >
            Node.js 安装完成，正在使用新版本。
          </p>
        </template>
      </NCard>

      <NCard class="app-panel" :bordered="false" size="large">
        <template #header>
          <span class="install__heading">fraq CLI</span>
        </template>
        <div class="install__row">
          <StatusBadge :tone="cli.installed ? 'success' : 'danger'">
            {{ cli.installed ? `已安装 ${cli.version}` : '未检测到' }}
          </StatusBadge>
          <AppButton
            v-if="!cli.installed"
            size="sm"
            :loading="installingCli"
            @click="installCli"
          >
            <NIcon><Download /></NIcon>
            安装 CLI
          </AppButton>
          <AppButton v-else variant="ghost" size="sm" @click="refreshCheck">
            <NIcon><Refresh /></NIcon>
            重新检查
          </AppButton>
        </div>
        <p class="install__hint">
          fraq CLI 用于启动和管理 fraq 核心，未安装时通过 npm 全局安装（npm install -g @fraqjs/cli）。
        </p>
        <div v-if="cliBusy" class="install__progress">
          <NProgress
            type="line"
            :percentage="status.progress"
            :show-indicator="false"
            :height="6"
          />
          <span class="install__progress-text" aria-live="polite">
            {{ status.message }}（{{ status.progress }}%）
          </span>
        </div>
        <p v-if="status.task === 'cli' && status.phase === 'error'" class="install__error">
          {{ status.error }}
        </p>
      </NCard>

      <NCard class="app-panel" :bordered="false" size="large">
        <template #header>
          <span class="install__heading">Milky 协议端</span>
        </template>

        <template v-if="protocol.reachable">
          <div class="install__row">
            <StatusBadge tone="success">已连接</StatusBadge>
            <AppButton variant="ghost" size="sm" @click="refreshCheck">
              <NIcon><Refresh /></NIcon>
              重新检查
            </AppButton>
          </div>
          <p class="install__hint">{{ protocol.detail }}</p>
          <div v-if="status.running" class="install__row">
            <StatusBadge tone="success">协议端运行中（PID {{ status.pid }}）</StatusBadge>
            <AppButton
              variant="danger-ghost"
              size="sm"
              :loading="stopping"
              @click="stopProtocol"
            >
              <NIcon><PlayerStop /></NIcon>
              停止协议端
            </AppButton>
          </div>
        </template>

        <template v-else-if="protocol.running">
          <div class="install__row">
            <StatusBadge tone="warning">协议端在运行</StatusBadge>
            <AppButton variant="ghost" size="sm" @click="refreshCheck">
              <NIcon><Refresh /></NIcon>
              重新检查
            </AppButton>
          </div>
          <p class="install__hint">{{ protocol.detail }}</p>
          <p class="install__hint">
            fraq 核心通过 webui 代理调用协议端，令牌不匹配会导致 API 调用失败（401）。
            请设置 FRAQ_WEBUI_MILKY_TOKEN 环境变量，或在设置页填写访问令牌后重启服务。
          </p>
          <div v-if="status.running" class="install__row">
            <StatusBadge tone="success">协议端运行中（PID {{ status.pid }}）</StatusBadge>
            <AppButton
              variant="danger-ghost"
              size="sm"
              :loading="stopping"
              @click="stopProtocol"
            >
              <NIcon><PlayerStop /></NIcon>
              停止协议端
            </AppButton>
          </div>
        </template>

        <template v-else>
          <div class="install__row">
            <StatusBadge tone="danger">无法连接</StatusBadge>
            <AppButton variant="ghost" size="sm" @click="refreshCheck">
              <NIcon><Refresh /></NIcon>
              重新检查
            </AppButton>
          </div>
          <p class="install__hint">
            {{ protocol.detail || '协议端未运行或地址不可达，请选择下方实现下载安装。' }}
          </p>

          <div class="install__field">
            <span class="install__label">协议端实现</span>
            <NRadioGroup v-model:value="source" name="protocol-source">
              <NSpace vertical :size="8">
                <NRadio
                  v-for="item in sources"
                  :key="item.id"
                  :value="item.id"
                  class="install__source"
                >
                  <span class="install__source-name">{{ item.label }}</span>
                  <span class="install__source-repo">
                    <NIcon size="16"><BrandGithub /></NIcon>
                    {{ item.repo }}
                  </span>
                </NRadio>
              </NSpace>
            </NRadioGroup>
          </div>

          <div class="install__field">
            <label class="install__label" for="release-version">版本</label>
            <NSelect
              id="release-version"
              v-model:value="tag"
              :options="releases.map((item) => ({
                label: `${item.tag}${item.prerelease ? '（预览版）' : ''} · ${formatDate(item.publishedAt)}`,
                value: item.tag,
              }))"
              :disabled="releasesLoading || releases.length === 0"
              :placeholder="releasesLoading ? '正在加载版本...' : '选择版本'"
            />
            <p v-if="releaseError" class="install__error">{{ releaseError }}</p>
          </div>

          <div v-if="currentRelease" class="install__field">
            <span class="install__label">下载文件</span>
            <NRadioGroup v-model:value="assetName" name="asset">
              <NSpace vertical :size="8">
                <NRadio
                  v-for="asset in currentRelease.assets"
                  :key="asset.name"
                  :value="asset.name"
                  class="install__asset"
                >
                  <span class="install__asset-name">{{ asset.name }}</span>
                  <span class="install__asset-size">{{ formatBytes(asset.size) }}</span>
                  <StatusBadge v-if="isRecommended(asset)" tone="info" :dot="false">
                    推荐
                  </StatusBadge>
                </NRadio>
              </NSpace>
            </NRadioGroup>
            <p v-if="currentRelease.assets.length === 0" class="install__hint">
              该版本没有可下载的文件
            </p>
          </div>

          <div class="install__actions">
            <AppButton :loading="downloading" :disabled="!assetName" @click="download">
              <NIcon><Download /></NIcon>
              下载并安装
            </AppButton>
            <AppButton
              v-if="status.phase === 'done' && status.exePath && status.task === 'protocol'"
              :loading="starting"
              @click="startProtocol"
            >
              <NIcon><PlayerPlay /></NIcon>
              启动协议端
            </AppButton>
            <AppButton
              v-if="status.running"
              variant="danger-ghost"
              :loading="stopping"
              @click="stopProtocol"
            >
              <NIcon><PlayerStop /></NIcon>
              停止协议端
            </AppButton>
          </div>

          <div v-if="protocolBusy" class="install__progress">
            <NProgress
              type="line"
              :percentage="status.progress"
              :show-indicator="false"
              :height="6"
            />
            <span class="install__progress-text" aria-live="polite">
              {{ status.message }}（{{ status.progress }}%）
            </span>
          </div>
          <p v-if="status.task === 'protocol' && status.phase === 'error'" class="install__error">
            {{ status.error }}
          </p>
          <p
            v-else-if="
              status.task === 'protocol' && status.phase === 'done' && !status.exePath
            "
            class="install__hint install__hint--notice"
          >
            文件已下载到本地，请手动运行安装程序完成安装。
          </p>
          <p class="install__hint">
            首次启动协议端需要在它自己的窗口扫码登录 QQ，之后即可正常使用。
          </p>
        </template>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.install {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 44rem;
}

.app-panel {
  --n-color: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
}

.install__heading {
  font-size: var(--text-base);
  font-weight: 600;
}

.install__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.install__row + .install__row {
  margin-top: var(--space-3);
}

.install__hint {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: var(--text-xs);
}

.install__dir-row {
  display: flex;
  gap: var(--space-2);
}

.install__dir-row .n-input {
  flex: 1;
}

.install__hint--notice {
  color: var(--primary);
}

.dir-picker__path {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.dir-picker__path-text {
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.dir-picker__list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 18rem;
  overflow-y: auto;
}

.dir-picker__item {
  width: 100%;
  justify-content: flex-start;
}

.dir-picker__empty {
  padding: var(--space-3);
  color: var(--muted);
  font-size: var(--text-sm);
}

.install__error {
  margin-top: var(--space-2);
  color: var(--danger);
  font-size: var(--text-xs);
}

.install__field {
  margin-top: var(--space-4);
}

.install__label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

.install__source {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
}

.install__source :deep(.n-radio__label),
.install__asset :deep(.n-radio__label) {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.install__source-name {
  font-size: var(--text-sm);
  font-weight: 600;
}

.install__source-repo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  color: var(--faint);
  font-size: var(--text-xs);
}

.install__asset {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
}

.install__asset-name {
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
}

.install__asset-size {
  margin-left: auto;
  color: var(--faint);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.install__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.install__progress {
  margin-top: var(--space-4);
}

.install__progress-text {
  display: block;
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: var(--text-xs);
}
</style>
