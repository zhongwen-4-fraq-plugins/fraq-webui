<script setup>
import { ref, watch } from 'vue'
import { store } from '../services/store.js'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  pluginId: { type: String, default: '' },
})

const emit = defineEmits(['update:open'])

const configText = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    error.value = ''
    configText.value = ''
    loading.value = true
    try {
      const config = await store.getPluginConfig(props.pluginId)
      configText.value = JSON.stringify(config, null, 2)
    } catch (requestError) {
      error.value = requestError instanceof Error ? requestError.message : '无法读取配置'
    } finally {
      loading.value = false
    }
  },
)

async function save() {
  let parsed
  try {
    parsed = JSON.parse(configText.value)
  } catch {
    error.value = 'JSON 格式不正确，请检查后重试'
    return
  }
  saving.value = true
  try {
    await store.updatePluginConfig(props.pluginId, parsed)
    emit('update:open', false)
  } catch (saveError) {
    error.value = saveError instanceof Error ? saveError.message : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ConfirmDialog
    :open="open"
    :title="`配置 ${pluginId}`"
    confirm-label="保存配置"
    :loading="saving"
    @update:open="emit('update:open', $event)"
    @confirm="save"
  >
    <textarea
      v-model="configText"
      class="config-editor"
      :disabled="loading || saving"
      rows="12"
      spellcheck="false"
      aria-label="插件配置 JSON"
      placeholder="{ }"
    />
    <p v-if="error" class="config-editor__error" role="alert">{{ error }}</p>
    <p class="config-editor__hint">
      密钥字段（apiKey / token 等）显示为 ******，保留 ****** 即不改动原值。保存后核心会自动重启生效。
    </p>
  </ConfirmDialog>
</template>

<style scoped>
.config-editor {
  width: 100%;
  min-height: 14rem;
  margin-top: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--ink);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  line-height: 1.6;
  resize: vertical;
}

.config-editor:focus {
  border-color: var(--success);
  outline: none;
}

.config-editor::placeholder {
  color: var(--placeholder);
}

.config-editor__error {
  margin-top: var(--space-2);
  color: var(--danger);
  font-size: var(--text-xs);
}

.config-editor__hint {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: var(--text-xs);
}
</style>
