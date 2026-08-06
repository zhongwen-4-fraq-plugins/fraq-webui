<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import IconDeviceFloppy from '~icons/tabler/device-floppy'
import IconEye from '~icons/tabler/eye'
import IconEyeOff from '~icons/tabler/eye-off'
import { store } from '../services/store.js'
import AppButton from '../components/AppButton.vue'
import ArgbField from '../components/ArgbField.vue'
import ErrorBanner from '../components/ErrorBanner.vue'
import PageHeader from '../components/PageHeader.vue'
import SkeletonBlock from '../components/SkeletonBlock.vue'

const form = reactive({
  baseUrl: '',
  accessToken: '',
})

const saving = ref(false)
const baseUrlError = ref('')
const showToken = ref(false)

const appearance = reactive(JSON.parse(JSON.stringify(store.state.appearance)))

watch(
  appearance,
  () => {
    store.setAppearance(JSON.parse(JSON.stringify(appearance)))
  },
  { deep: true },
)

const bgPreview = computed(() => {
  const { mode, value } = appearance.background
  if (mode === 'url' && value.trim()) return `url('${value.trim()}')`
  if (mode === 'file' && value) return `url('${value}')`
  return "url('/bg.jpg')"
})

function onBackgroundFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    appearance.background.mode = 'file'
    appearance.background.value = reader.result
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function resetBackground() {
  appearance.background.mode = 'default'
  appearance.background.value = ''
}

onMounted(async () => {
  await store.refreshSettings()
  Object.assign(form, {
    baseUrl: store.state.settings.baseUrl,
    accessToken: store.state.settings.accessToken,
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
      <section class="settings__group" aria-labelledby="connection-heading">
        <h3 id="connection-heading" class="settings__heading">Milky 连接</h3>

        <div class="field">
          <label class="field__label" for="base-url">服务地址</label>
          <input
            id="base-url"
            v-model="form.baseUrl"
            class="field__input"
            type="url"
            placeholder="http://127.0.0.1:4649"
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
          <div class="field__token">
            <input
              id="access-token"
              v-model="form.accessToken"
              class="field__input"
              :type="showToken ? 'text' : 'password'"
              autocomplete="off"
              placeholder="留空表示不校验"
            />
            <button
              type="button"
              class="field__toggle"
              :aria-label="showToken ? '隐藏访问令牌' : '显示访问令牌'"
              @click="showToken = !showToken"
            >
              <IconEyeOff v-if="showToken" aria-hidden="true" />
              <IconEye v-else aria-hidden="true" />
            </button>
          </div>
          <p class="field__hint">
            {{
              store.state.settings.hasAccessToken
                ? '已配置访问令牌，留空表示不修改。'
                : '协议端访问令牌，留空表示不校验。'
            }}
          </p>
        </div>
      </section>

      <section class="settings__group" aria-labelledby="appearance-heading">
        <h3 id="appearance-heading" class="settings__heading">界面外观</h3>

        <div class="field">
          <label class="field__label" for="bg-mode">背景图</label>
          <select id="bg-mode" v-model="appearance.background.mode" class="field__input">
            <option value="default">默认背景</option>
            <option value="url">图片链接</option>
            <option value="file">本地上传</option>
          </select>
          <input
            v-if="appearance.background.mode === 'url'"
            v-model="appearance.background.value"
            type="url"
            class="field__input field__input--gap"
            placeholder="https://example.com/background.jpg"
          />
          <input
            v-else-if="appearance.background.mode === 'file'"
            type="file"
            accept="image/*"
            class="field__input field__input--gap"
            @change="onBackgroundFile"
          />
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
        </div>
        <p class="field__hint">颜色格式 ARGB（#AARRGGBB），修改即时生效并自动保存。</p>
      </section>

      <div class="settings__save">
        <AppButton type="submit" :loading="saving">
          <IconDeviceFloppy aria-hidden="true" />
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

.settings__group {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface));
}

.settings__heading {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-4);
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

.field__input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  background: var(--surface-2);
  color: var(--ink);
  font-size: var(--text-sm);
}

.field__input::placeholder {
  color: var(--muted);
}

.field__input[aria-invalid='true'] {
  background: var(--danger-soft);
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

.field__input--gap {
  margin-top: var(--space-2);
}

.appearance__preview {
  height: 8rem;
  margin-top: var(--space-3);
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
}

.appearance__reset {
  margin-top: var(--space-2);
}

.appearance__colors {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.field__token {
  position: relative;
}

.field__token .field__input {
  padding-right: 2.75rem;
}

.field__toggle {
  position: absolute;
  top: 50%;
  right: var(--space-2);
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.field__toggle:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.field__toggle svg {
  width: 1.125rem;
  height: 1.125rem;
}

.field--check {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.field__check-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

.field__checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
}

.field--check .field__hint {
  margin-top: 0;
}

.settings__save {
  display: flex;
  justify-content: flex-end;
}
</style>
