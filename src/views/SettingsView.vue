<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import IconDeviceFloppy from '~icons/tabler/device-floppy'
import IconEye from '~icons/tabler/eye'
import IconEyeOff from '~icons/tabler/eye-off'
import IconUpload from '~icons/tabler/upload'
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
const showToken = ref(false)
const bgFileInput = ref(null)
const dragActive = ref(false)

// 表单有未保存的修改时，输入框边框显示主题色
const dirty = computed(
  () =>
    form.baseUrl !== store.state.settings.baseUrl ||
    form.accessToken !== store.state.settings.accessToken ||
    form.appDir !== store.state.settings.appDir,
)

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

function onBackgroundFile(event) {
  applyBackgroundFile(event.target.files?.[0])
  event.target.value = ''
}

function onBackgroundDrop(event) {
  dragActive.value = false
  applyBackgroundFile(event.dataTransfer?.files?.[0])
}

function pickBackground() {
  bgFileInput.value?.click()
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
            :class="{ 'field__input--dirty': dirty }"
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
              :class="{ 'field__input--dirty': dirty }"
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

      <section class="settings__group" aria-labelledby="project-heading">
        <h3 id="project-heading" class="settings__heading">fraq 项目</h3>

        <div class="field">
          <label class="field__label" for="app-dir">项目目录</label>
          <input
            id="app-dir"
            v-model="form.appDir"
            class="field__input"
            type="text"
            placeholder="D:\bot\fraq-plugins\my-fraq-app"
            :class="{ 'field__input--dirty': dirty }"
            autocomplete="off"
          />
          <p class="field__hint">
            包含 fraq.yml 的项目目录；修改保存后需重启核心生效。
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
            class="field__input field__input--gap appearance__url-input"
            placeholder="https://example.com/background.jpg"
          />
          <div
            v-else-if="appearance.background.mode === 'file'"
            class="appearance__dropzone"
            :class="{ 'appearance__dropzone--drag': dragActive }"
            role="button"
            tabindex="0"
            :aria-label="bgFileName ? `更换背景图（${bgFileName}）` : '选择背景图'"
            @click="pickBackground"
            @keydown.enter.prevent="pickBackground"
            @keydown.space.prevent="pickBackground"
            @dragover.prevent="dragActive = true"
            @dragleave.prevent="dragActive = false"
            @drop.prevent="onBackgroundDrop"
          >
            <IconUpload class="appearance__dropzone-icon" aria-hidden="true" />
            <span class="appearance__dropzone-text">
              {{ bgFileName || '点击选择图片，或将图片拖到这里' }}
            </span>
            <input
              ref="bgFileInput"
              type="file"
              accept="image/*"
              class="appearance__file-input"
              @change="onBackgroundFile"
            />
          </div>
          <div class="appearance__blur">
            <label for="bg-blur">背景模糊</label>
            <input
              id="bg-blur"
              v-model="backgroundBlur"
              type="range"
              min="0"
              max="40"
              step="1"
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
          <textarea
            id="custom-css"
            v-model="customCss"
            class="field__input field__input--code"
            rows="8"
            spellcheck="false"
            placeholder="例如 .sidebar { background: red; }"
          />
          <p class="field__hint">覆盖整个界面的样式，改动即时生效并保存到本浏览器。</p>
        </div>
        <p class="field__hint">颜色格式 ARGB（#AARRGGBB）+ 模糊程度，修改即时生效并自动保存。</p>
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
/* 设置表单：纵向排列，限宽，区块间距统一 */
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 40rem; /* 表单最大宽度 */
}

/* 设置分组卡片：毛玻璃 */
.settings__group {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  background: var(--app-area-bg, var(--surface)); /* 面板底色，跟随外观 */
  /* 毛玻璃效果 */
  -webkit-backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-area-blur, 16px)) saturate(1.4);
}

/* 分组标题 */
.settings__heading {
  font-size: var(--text-base);
  font-weight: 600;
  margin-bottom: var(--space-4); /* 与字段间距 */
}

/* 相邻字段间距 */
.field + .field {
  margin-top: var(--space-4);
}

/* 字段标签 */
.field__label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* 输入框：通栏，跟随组件外观 */
.field__input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2)); /* 组件底色 */
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

/* 输入框占位文字 */
.field__input::placeholder {
  color: var(--placeholder);
}

/* 校验失败：浅红底 */
.field__input[aria-invalid='true'] {
  background: var(--danger-soft); /* 危险浅底 */
}

/* 有未保存修改：主色边框 */
.field__input.field__input--dirty {
  border-color: var(--primary); /* 主色描边提示 */
}

/* 提示与错误共用布局 */
.field__hint,
.field__error {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
}

/* 提示文字 */
.field__hint {
  color: var(--muted); /* 次要文字色 */
}

/* 错误文字 */
.field__error {
  color: var(--danger); /* 危险色 */
}

/* 次级输入（如背景图链接）：与上方控件留间距 */
.field__input--gap {
  margin-top: var(--space-2);
}

/* 背景图预览区：固定高度，cover 铺满 */
.appearance__preview {
  height: 8rem; /* 预览区高度 */
  margin-top: var(--space-3);
  border-radius: var(--radius-md);
  background-size: cover; /* 铺满不拉伸 */
  background-position: center; /* 居中 */
}

/* 背景模糊行 */
.appearance__blur {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

/* 模糊标签：固定宽度对齐 */
.appearance__blur label {
  width: 4.5rem;
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

/* 模糊滑杆 */
.appearance__blur-input {
  -webkit-appearance: none; /* 去掉默认样式 */
  appearance: none;
  flex: 1;
  max-width: 12rem; /* 限制宽度 */
  height: 0.375rem; /* 轨道高度 */
  border: none;
  border-radius: 999px;
  background: var(--app-slider-track-bg, var(--surface-2)); /* 轨道色 */
  outline: none; /* 去掉默认焦点框 */
}

/* 滑杆滑块（WebKit） */
.appearance__blur-input::-webkit-slider-thumb {
  -webkit-appearance: none; /* 去掉默认滑块 */
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

/* 滑杆滑块（Firefox） */
.appearance__blur-input::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

/* 模糊数值：等宽字体 */
.appearance__blur-value {
  width: 2.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; /* 等宽字体 */
  font-size: var(--text-xs);
  color: var(--muted);
}

/* 背景图拖拽/点击区 */
.appearance__dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 5rem; /* 保证可点区域 */
  margin-top: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--muted);
  font-size: var(--text-sm);
  cursor: pointer; /* 整块可点 */
  /* 底色与文字色过渡 */
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;
}

/* 悬停：底色加深 */
.appearance__dropzone:hover {
  background: var(--border);
  color: var(--app-text-color, var(--ink));
}

/* 拖拽经过：主色浅底 */
.appearance__dropzone--drag {
  background: var(--primary-soft); /* 主色浅底 */
  color: var(--app-text-color, var(--ink));
}

/* 键盘聚焦：主色外圈 */
.appearance__dropzone:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

/* 拖拽区图标 */
.appearance__dropzone-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0; /* 不收缩 */
}

/* 文件名/提示文字：长名可换行 */
.appearance__dropzone-text {
  overflow-wrap: anywhere; /* 超长文件名断行 */
}

/* 隐藏原生文件输入，用整块区域代替 */
.appearance__file-input {
  display: none; /* 视觉上隐藏，仍可被点击触发 */
}

/* 恢复默认按钮：与上方留间距 */
.appearance__reset {
  margin-top: var(--space-2);
}

/* 自定义 CSS 区块 */
.appearance__css {
  margin-top: var(--space-4);
}

/* 代码输入框：等宽字体，可垂直拉伸 */
.field__input--code {
  height: auto; /* 由内容撑高 */
  min-height: 10rem; /* 最小可读高度 */
  padding: var(--space-2) var(--space-3);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; /* 等宽字体 */
  font-size: var(--text-xs);
  line-height: 1.5;
  resize: vertical; /* 只允许上下拉伸 */
}

/* 背景图链接占位文字 */
.appearance__url-input::placeholder {
  color: var(--placeholder);
}

/* 各区域 ARGB 配色行 */
.appearance__colors {
  display: flex;
  flex-direction: column;
  gap: var(--space-3); /* 行间距 */
  margin-top: var(--space-4);
}

/* 令牌输入框包裹：相对定位放显示按钮 */
.field__token {
  position: relative;
}

/* 右侧留出按钮空间 */
.field__token .field__input {
  padding-right: 2.75rem; /* 右 44px 放显示按钮 */
}

/* 显示/隐藏令牌按钮：输入框右侧垂直居中 */
.field__toggle {
  position: absolute;
  top: 50%;
  right: var(--space-2);
  transform: translateY(-50%); /* 垂直居中 */
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

/* 按钮悬停 */
.field__toggle:hover {
  background: var(--surface-2);
  color: var(--app-text-color, var(--ink));
}

/* 按钮图标尺寸 */
.field__toggle svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* 复选框字段行 */
.field--check {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* 复选框标签 */
.field__check-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* 复选框：主色渲染 */
.field__checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary); /* 系统复选框主色 */
}

/* 复选框行内的提示：不需要额外上边距 */
.field--check .field__hint {
  margin-top: 0; /* 与复选框同行对齐 */
}

/* 底部保存按钮：靠右 */
.settings__save {
  display: flex;
  justify-content: flex-end;
}
</style>
