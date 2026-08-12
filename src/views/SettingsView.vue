<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  NCard,
  NIcon,
  NInput,
  NSelect,
  NSlider,
  NUpload,
  NUploadDragger,
} from 'naive-ui'
import { DeviceFloppy, Upload } from '@vicons/tabler'
import { store } from '../services/store.js'
import { createDefaultAppearance } from '../models/appearance.js'
import AppButton from '../components/AppButton.vue'
import ArgbField from '../components/ArgbField.vue'
import ErrorBanner from '../components/ErrorBanner.vue'
import PageHeader from '../components/PageHeader.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'

const form = reactive({
  baseUrl: '',
  accessToken: '',
  appDir: '',
})

const saving = ref(false)
const baseUrlError = ref('')

const appearance = reactive(JSON.parse(JSON.stringify(store.state.appearance)))
const customCss = ref(store.state.customCss)

watch(
  appearance,
  () => {
    store.setAppearance(JSON.parse(JSON.stringify(appearance)))
  },
  { deep: true },
)

watch(customCss, (value) => {
  store.setCustomCss(value)
})

const bgPreview = computed(() => {
  const { mode, value } = appearance.background
  if (mode === 'url' && value.trim()) return `url('${value.trim()}')`
  if (mode === 'file' && value) return `url('${value}')`
  return "url('/bg.jpg')"
})

const bgFileName = computed(() =>
  appearance.background.mode === 'file' ? appearance.background.fileName : '',
)

const backgroundBlur = computed({
  get: () => appearance.background.blur,
  set: (value) => {
    appearance.background.blur = Number(value)
  },
})

function onUploadChange({ file }) {
  applyBackgroundFile(file?.file)
}

function applyBackgroundFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = () => {
    appearance.background.mode = 'file'
    appearance.background.value = reader.result
    appearance.background.fileName = file.name
  }
  reader.readAsDataURL(file)
}

function resetBackground() {
  appearance.background.mode = 'default'
  appearance.background.value = ''
  appearance.background.fileName = ''
  appearance.background.blur = 0
}

function resetAppearance() {
  const defaults = createDefaultAppearance()
  appearance.background = defaults.background
  appearance.colors.topbar = defaults.colors.topbar
  appearance.colors.sidebar = defaults.colors.sidebar
  appearance.colors.area = defaults.colors.area
  appearance.colors.components = defaults.colors.components
  appearance.colors.dialog = defaults.colors.dialog
  appearance.colors.text = defaults.colors.text
}

onMounted(async () => {
  await store.refreshSettings()
  Object.assign(form, {
    baseUrl: store.state.settings.baseUrl,
    accessToken: store.state.settings.accessToken,
    appDir: store.state.settings.appDir,
  })
})

async function save() {
  baseUrlError.value = ''
  try {
    const url = new URL(form.baseUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      baseUrlError.value = '服务地址需要以 http:// 或 https:// 开头'
      return
    }
  } catch {
    baseUrlError.value = '服务地址格式不正确，例如 http://127.0.0.1:4649'
    return
  }

  saving.value = true
  try {
    await store.saveSettings({
      baseUrl: form.baseUrl.trim().replace(/\/+$/, ''),
      accessToken: form.accessToken,
      appDir: form.appDir.trim(),
    })
  } catch (error) {
    store.toast('error', error instanceof Error ? error.message : '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="设置" description="配置 Milky 连接地址与访问令牌。" />

    <ErrorBanner
      v-if="store.state.errors.settings"
      :message="store.state.errors.settings"
      @retry="store.refreshSettings"
    />

    <SkeletonBlock v-if="store.state.loading.settings" :lines="5" />

    <form v-else class="settings" @submit.prevent="save">
      <NCard class="app-panel" :bordered="false" size="large">
        <template #header>
          <span class="settings__heading">Milky 连接</span>
        </template>

        <div class="field">
          <label class="field__label" for="base-url">服务地址</label>
          <NInput
            id="base-url"
            v-model:value="form.baseUrl"
            type="text"
            placeholder="http://127.0.0.1:4649"
            :status="baseUrlError ? 'error' : undefined"
            :aria-invalid="Boolean(baseUrlError)"
            :aria-describedby="baseUrlError ? 'base-url-error' : 'base-url-hint'"
          />
          <p v-if="baseUrlError" id="base-url-error" class="field__error">
            {{ baseUrlError }}
          </p>
          <p v-else id="base-url-hint" class="field__hint">
            fraq 核心连接的 Milky 协议端地址。
          </p>
        </div>

        <div class="field">
          <label class="field__label" for="access-token">访问令牌</label>
          <NInput
            id="access-token"
            v-model:value="form.accessToken"
            type="password"
            show-password-on="click"
            autocomplete="off"
            placeholder="留空表示不校验"
          />
          <p class="field__hint">
            {{
              store.state.settings.hasAccessToken
                ? '已配置访问令牌，留空表示不修改。'
                : '协议端访问令牌，留空表示不校验。'
            }}
          </p>
        </div>
      </NCard>

      <NCard class="app-panel" :bordered="false" size="large">
        <template #header>
          <span class="settings__heading">fraq 项目</span>
        </template>

        <div class="field">
          <label class="field__label" for="app-dir">项目目录</label>
          <NInput
            id="app-dir"
            v-model:value="form.appDir"
            placeholder="D:\bot\fraq-plugins\my-fraq-app"
            autocomplete="off"
          />
          <p class="field__hint">
            包含 fraq.yml 的项目目录；修改保存后需重启核心生效。
          </p>
        </div>
      </NCard>

      <NCard class="app-panel" :bordered="false" size="large">
        <template #header>
          <span class="settings__heading">界面外观</span>
        </template>

        <div class="field">
          <label class="field__label" for="bg-mode">背景图</label>
          <NSelect
            id="bg-mode"
            v-model:value="appearance.background.mode"
            :options="[
              { label: '默认背景', value: 'default' },
              { label: '图片链接', value: 'url' },
              { label: '本地上传', value: 'file' },
            ]"
          />
          <NInput
            v-if="appearance.background.mode === 'url'"
            v-model:value="appearance.background.value"
            type="text"
            class="appearance__gap"
            placeholder="https://example.com/background.jpg"
          />
          <NUpload
            v-else-if="appearance.background.mode === 'file'"
            :default-upload="false"
            accept="image/*"
            :show-file-list="false"
            class="appearance__gap"
            @change="onUploadChange"
          >
            <NUploadDragger>
              <div class="appearance__dropzone">
                <NIcon size="20"><Upload /></NIcon>
                <span class="appearance__dropzone-text">
                  {{ bgFileName || '点击选择图片，或将图片拖到这里' }}
                </span>
              </div>
            </NUploadDragger>
          </NUpload>
          <div class="appearance__blur">
            <label for="bg-blur">背景模糊</label>
            <NSlider
              id="bg-blur"
              v-model:value="backgroundBlur"
              :min="0"
              :max="40"
              :tooltip="false"
              class="appearance__blur-input"
            />
            <span class="appearance__blur-value">{{ backgroundBlur }}px</span>
          </div>
          <div
            class="appearance__preview"
            :style="{ backgroundImage: bgPreview }"
            role="img"
            aria-label="背景图预览"
          />
          <AppButton
            v-if="appearance.background.mode !== 'default'"
            variant="ghost"
            size="sm"
            class="appearance__reset"
            @click="resetBackground"
          >
            恢复默认背景
          </AppButton>
        </div>

        <div class="appearance__colors">
          <ArgbField label="顶栏" :model="appearance.colors.topbar" />
          <ArgbField label="侧边栏" :model="appearance.colors.sidebar" />
          <ArgbField label="内容区域" :model="appearance.colors.area" />
          <ArgbField label="组件" :model="appearance.colors.components" />
          <ArgbField label="弹窗" :model="appearance.colors.dialog" />
          <ArgbField label="文字" :model="appearance.colors.text" />
        </div>
        <AppButton variant="secondary" size="sm" class="appearance__reset" @click="resetAppearance">
          恢复默认外观
        </AppButton>

        <div class="field appearance__css">
          <label class="field__label" for="custom-css">自定义 CSS</label>
          <NInput
            id="custom-css"
            v-model:value="customCss"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 16 }"
            spellcheck="false"
            placeholder="例如 .sidebar { background: red; }"
          />
          <p class="field__hint">覆盖整个界面的样式，改动即时生效并保存到本浏览器。</p>
        </div>
        <p class="field__hint">颜色格式 ARGB（#AARRGGBB）+ 模糊程度，修改即时生效并自动保存。</p>
      </NCard>

      <div class="settings__save">
        <AppButton type="submit" :loading="saving">
          <NIcon><DeviceFloppy /></NIcon>
          保存更改
        </AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 40rem;
}

.app-panel {
  --n-color: var(--app-area-bg, var(--surface));
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
}

.settings__heading {
  font-size: var(--text-base);
  font-weight: 600;
}

.field + .field {
  margin-top: var(--space-4);
}

.field__label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

.field__hint,
.field__error {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
}

.field__hint {
  color: var(--muted);
}

.field__error {
  color: var(--danger);
}

.appearance__gap {
  margin-top: var(--space-2);
}

.appearance__preview {
  height: 8rem;
  margin-top: var(--space-3);
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--border);
}

.appearance__blur {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.appearance__blur label {
  width: 4.5rem;
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

.appearance__blur-input {
  flex: 1;
  max-width: 12rem;
}

.appearance__blur-value {
  width: 2.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--muted);
}

.appearance__dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 5rem;
  color: var(--muted);
  font-size: var(--text-sm);
}

.appearance__dropzone-text {
  overflow-wrap: anywhere;
}

.appearance__reset {
  margin-top: var(--space-2);
}

.appearance__css {
  margin-top: var(--space-4);
}

.appearance__colors {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.settings__save {
  display: flex;
  justify-content: flex-end;
}
</style>
