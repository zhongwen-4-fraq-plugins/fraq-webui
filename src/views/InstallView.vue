<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import IconBrandGithub from '~icons/tabler/brand-github'
import IconDownload from '~icons/tabler/download'
import IconPlayerPlay from '~icons/tabler/player-play'
import IconPlayerStop from '~icons/tabler/player-stop'
import IconRefresh from '~icons/tabler/refresh'
import { httpApi } from '../services/httpApi.js'
import { formatBytes, formatDate } from '../data/format.js'
import AppButton from '../components/AppButton.vue'
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

    <ErrorBanner
      v-if="checkError"
      :message="checkError"
      @retry="refreshCheck"
    />

    <SkeletonBlock v-if="checking" :lines="5" />

    <div v-else class="install">
      <section class="install__group" aria-labelledby="dir-heading">
        <h3 id="dir-heading" class="install__heading">安装目录</h3>
        <input
          id="install-dir"
          v-model.trim="protocolDir"
          class="install__input"
          type="text"
          placeholder="D:\bot\fraq-webui\protocols"
          autocomplete="off"
          aria-label="安装目录"
        />
        <p class="install__hint">
          Node.js 与协议端的下载解压位置，需为完整路径；留空使用默认目录，修改后自动保存。
        </p>
      </section>

      <section class="install__group" aria-labelledby="node-heading">
        <h3 id="node-heading" class="install__heading">Node.js</h3>
        <div class="install__row">
          <StatusBadge :tone="node.installed ? 'success' : 'danger'">
            {{ node.installed ? `已安装 ${node.nodeVersion}` : '未检测到' }}
          </StatusBadge>
          <AppButton v-if="node.installed" variant="ghost" size="sm" @click="refreshCheck">
            <IconRefresh aria-hidden="true" />
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
            <select
              id="node-version"
              v-model="nodeTag"
              class="install__input"
              :disabled="nodeReleasesLoading || nodeReleases.length === 0"
            >
              <option v-if="nodeReleasesLoading" value="">正在加载版本...</option>
              <option v-for="item in nodeReleases" :key="item.version" :value="item.version">
                {{ item.version }}{{ item.lts ? `（LTS ${item.lts}）` : '' }}
              </option>
            </select>
            <p v-if="nodeReleaseError" class="install__error">{{ nodeReleaseError }}</p>
          </div>

          <div class="install__actions">
            <AppButton :loading="nodeInstalling" :disabled="!nodeTag" @click="installNode">
              <IconDownload aria-hidden="true" />
              下载并安装
            </AppButton>
          </div>

          <div
            v-if="nodeBusy"
            class="install__progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="status.progress"
          >
            <div class="install__bar" :style="{ width: `${status.progress}%` }" />
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
      </section>

      <section class="install__group" aria-labelledby="cli-heading">
        <h3 id="cli-heading" class="install__heading">fraq CLI</h3>
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
            <IconDownload aria-hidden="true" />
            安装 CLI
          </AppButton>
          <AppButton v-else variant="ghost" size="sm" @click="refreshCheck">
            <IconRefresh aria-hidden="true" />
            重新检查
          </AppButton>
        </div>
        <p class="install__hint">
          fraq CLI 用于启动和管理 fraq 核心，未安装时通过 npm 全局安装（npm install -g @fraqjs/cli）。
        </p>
        <div v-if="cliBusy" class="install__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="status.progress">
          <div class="install__bar" :style="{ width: `${status.progress}%` }" />
          <span class="install__progress-text" aria-live="polite">
            {{ status.message }}（{{ status.progress }}%）
          </span>
        </div>
        <p v-if="status.task === 'cli' && status.phase === 'error'" class="install__error">
          {{ status.error }}
        </p>
      </section>

      <section class="install__group" aria-labelledby="protocol-heading">
        <h3 id="protocol-heading" class="install__heading">Milky 协议端</h3>

        <template v-if="protocol.reachable">
          <div class="install__row">
            <StatusBadge tone="success">已连接</StatusBadge>
            <AppButton variant="ghost" size="sm" @click="refreshCheck">
              <IconRefresh aria-hidden="true" />
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
              <IconPlayerStop aria-hidden="true" />
              停止协议端
            </AppButton>
          </div>
        </template>

        <template v-else-if="protocol.running">
          <div class="install__row">
            <StatusBadge tone="warning">协议端在运行</StatusBadge>
            <AppButton variant="ghost" size="sm" @click="refreshCheck">
              <IconRefresh aria-hidden="true" />
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
              <IconPlayerStop aria-hidden="true" />
              停止协议端
            </AppButton>
          </div>
        </template>

        <template v-else>
          <div class="install__row">
            <StatusBadge tone="danger">无法连接</StatusBadge>
            <AppButton variant="ghost" size="sm" @click="refreshCheck">
              <IconRefresh aria-hidden="true" />
              重新检查
            </AppButton>
          </div>
          <p class="install__hint">
            {{ protocol.detail || '协议端未运行或地址不可达，请选择下方实现下载安装。' }}
          </p>

          <div class="install__sources" role="radiogroup" aria-label="选择协议端">
            <label
              v-for="item in sources"
              :key="item.id"
              class="install__source"
              :class="{ 'install__source--active': source === item.id }"
            >
              <input v-model="source" type="radio" :value="item.id" class="install__radio" />
              <span class="install__source-name">{{ item.label }}</span>
              <span class="install__source-repo">
                <IconBrandGithub aria-hidden="true" />
                {{ item.repo }}
              </span>
            </label>
          </div>

          <div class="install__field">
            <label class="install__label" for="release-version">版本</label>
            <select
              id="release-version"
              v-model="tag"
              class="install__input"
              :disabled="releasesLoading || releases.length === 0"
            >
              <option v-if="releasesLoading" value="">正在加载版本...</option>
              <option v-for="item in releases" :key="item.tag" :value="item.tag">
                {{ item.tag }}{{ item.prerelease ? '（预览版）' : '' }} · {{ formatDate(item.publishedAt) }}
              </option>
            </select>
            <p v-if="releaseError" class="install__error">{{ releaseError }}</p>
          </div>

          <div v-if="currentRelease" class="install__field">
            <span class="install__label">下载文件</span>
            <div class="install__assets" role="radiogroup" aria-label="下载文件">
              <label
                v-for="asset in currentRelease.assets"
                :key="asset.name"
                class="install__asset"
                :class="{ 'install__asset--active': assetName === asset.name }"
              >
                <input
                  v-model="assetName"
                  type="radio"
                  :value="asset.name"
                  class="install__radio"
                />
                <span class="install__asset-name">{{ asset.name }}</span>
                <span class="install__asset-size">{{ formatBytes(asset.size) }}</span>
                <StatusBadge v-if="isRecommended(asset)" tone="info" :dot="false">
                  推荐
                </StatusBadge>
              </label>
              <p v-if="currentRelease.assets.length === 0" class="install__hint">
                该版本没有可下载的文件
              </p>
            </div>
          </div>

          <div class="install__actions">
            <AppButton :loading="downloading" :disabled="!assetName" @click="download">
              <IconDownload aria-hidden="true" />
              下载并安装
            </AppButton>
            <AppButton
              v-if="status.phase === 'done' && status.exePath && status.task === 'protocol'"
              :loading="starting"
              @click="startProtocol"
            >
              <IconPlayerPlay aria-hidden="true" />
              启动协议端
            </AppButton>
            <AppButton
              v-if="status.running"
              variant="danger-ghost"
              :loading="stopping"
              @click="stopProtocol"
            >
              <IconPlayerStop aria-hidden="true" />
              停止协议端
            </AppButton>
          </div>

          <div
            v-if="protocolBusy"
            class="install__progress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="status.progress"
          >
            <div class="install__bar" :style="{ width: `${status.progress}%` }" />
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
      </section>
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

.install__group {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
}

.install__heading {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-4);
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

.install__hint--notice {
  color: var(--primary);
}

.install__error {
  margin-top: var(--space-2);
  color: var(--danger);
  font-size: var(--text-xs);
}

.install__sources {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.install__source {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  cursor: pointer;
}

.install__source--active {
  border-color: var(--primary);
}

.install__radio {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
  flex-shrink: 0;
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

.install__source-repo svg {
  width: 1rem;
  height: 1rem;
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

.install__input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

.install__assets {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.install__asset {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  cursor: pointer;
}

.install__asset--active {
  border-color: var(--primary);
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

.install__bar {
  height: 0.375rem;
  border-radius: 999px;
  background: var(--primary);
  transition: width 300ms ease-out;
}

.install__progress-text {
  display: block;
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: var(--text-xs);
}
</style>
