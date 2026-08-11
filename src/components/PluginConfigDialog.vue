<script setup>
import { ref, watch } from 'vue'
import { httpApi } from '../services/httpApi.js'
import { getPluginSchema, getByPath, setByPath, deleteByPath } from '../data/pluginSchemas.js'
import { store } from '../services/store.js'
import ConfirmDialog from './ConfirmDialog.vue'
import SkeletonBlock from './SkeletonBlock.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  plugin: { type: Object, default: null },
})

const emit = defineEmits(['update:open'])

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const schema = ref(null)
const originalConfig = ref({})
const form = ref({})
const jsonText = ref('')

watch(
  () => [props.open, props.plugin?.id],
  async ([open, id]) => {
    if (!open || !id) return
    loading.value = true
    error.value = ''
    try {
      const result = await httpApi.getPluginConfig(id)
      originalConfig.value = result.config ?? {}
      schema.value = getPluginSchema(id)
      if (schema.value) {
        form.value = {}
        for (const field of schema.value.fields) {
          const value = getByPath(originalConfig.value, field.key)
          if (field.type === 'json') {
            form.value[field.key] = JSON.stringify(value ?? {}, null, 2)
          } else if (field.type === 'boolean') {
            form.value[field.key] = value ?? false
          } else {
            form.value[field.key] = value ?? ''
          }
        }
      } else {
        jsonText.value = JSON.stringify(originalConfig.value, null, 2)
      }
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : '无法读取配置'
    } finally {
      loading.value = false
    }
  },
)

async function save() {
  saving.value = true
  error.value = ''
  try {
    let config
    if (schema.value) {
      config = JSON.parse(JSON.stringify(originalConfig.value))
      for (const field of schema.value.fields) {
        const value = form.value[field.key]
        if (field.type === 'json') {
          let parsed
          try {
            parsed = JSON.parse(String(value ?? '').trim() || '{}')
          } catch {
            throw new Error(`${field.label} 不是合法的 JSON`)
          }
          if (Object.keys(parsed).length > 0) {
            setByPath(config, field.key, parsed)
          } else {
            deleteByPath(config, field.key)
          }
        } else if (field.type === 'boolean') {
          setByPath(config, field.key, Boolean(value))
        } else if (field.type === 'number') {
          if (value !== '' && value != null) {
            setByPath(config, field.key, Number(value))
          } else {
            deleteByPath(config, field.key)
          }
        } else if (field.type === 'select') {
          if (value) {
            setByPath(config, field.key, value)
          } else {
            deleteByPath(config, field.key)
          }
        } else if (String(value ?? '').trim() !== '') {
          setByPath(config, field.key, String(value).trim())
        } else {
          deleteByPath(config, field.key)
        }
      }
    } else {
      try {
        config = JSON.parse(String(jsonText.value ?? '').trim() || '{}')
      } catch {
        throw new Error('配置不是合法的 JSON')
      }
    }
    await httpApi.savePluginConfig(props.plugin.id, config)
    store.toast('success', '配置已保存')
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
    :title="`配置 ${plugin?.name ?? ''}`"
    confirm-label="保存配置"
    :loading="saving"
    @confirm="save"
    @update:open="emit('update:open', $event)"
  >
    <SkeletonBlock v-if="loading" :lines="4" />
    <template v-else>
      <p v-if="error" class="cfg-error">{{ error }}</p>

      <div v-if="schema" class="cfg-form">
        <div v-for="field in schema.fields" :key="field.key" class="cfg-field">
          <template v-if="field.type === 'boolean'">
            <label class="cfg-check" :for="`cfg-${field.key}`">
              <input
                :id="`cfg-${field.key}`"
                v-model="form[field.key]"
                type="checkbox"
                class="cfg-checkbox"
              />
              {{ field.label }}
            </label>
          </template>
          <template v-else>
            <label class="cfg-label" :for="`cfg-${field.key}`">{{ field.label }}</label>
            <input
              v-if="field.type === 'text' || field.type === 'password'"
              :id="`cfg-${field.key}`"
              v-model="form[field.key]"
              class="install-input cfg-input"
              :type="field.type"
              :placeholder="field.placeholder"
              autocomplete="off"
            />
            <input
              v-else-if="field.type === 'number'"
              :id="`cfg-${field.key}`"
              v-model="form[field.key]"
              type="number"
              class="install-input cfg-input"
              :placeholder="field.placeholder"
            />
            <select
              v-else-if="field.type === 'select'"
              :id="`cfg-${field.key}`"
              v-model="form[field.key]"
              class="install-input cfg-input"
            >
              <option value="">默认</option>
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <textarea
              v-else-if="field.type === 'json'"
              :id="`cfg-${field.key}`"
              v-model="form[field.key]"
              class="install-input cfg-input cfg-input--json"
              rows="7"
              spellcheck="false"
            />
          </template>
          <p v-if="field.hint" class="cfg-hint">{{ field.hint }}</p>
        </div>
        <p class="cfg-hint">保存后需重启核心才能生效；密钥字段显示为 ******，未改动会保留原值。</p>
      </div>

      <div v-else class="cfg-field">
        <label class="cfg-label" for="cfg-json">配置（JSON）</label>
        <textarea
          id="cfg-json"
          v-model="jsonText"
          class="install-input cfg-input cfg-input--json"
          rows="12"
          spellcheck="false"
        />
        <p class="cfg-hint">
          直接编辑该插件在 fraq.yml 中的配置；密钥字段显示为 ******，未改动会保留原值。
        </p>
      </div>
    </template>
  </ConfirmDialog>
</template>

<style scoped>
.cfg-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cfg-field {
  display: flex;
  flex-direction: column;
}

.cfg-label {
  margin-bottom: var(--space-2);
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
  font-weight: 500;
}

.cfg-input {
  width: 100%;
  height: 2.5rem;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

.cfg-input--json {
  height: auto;
  min-height: 7rem;
  padding: var(--space-2) var(--space-3);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  line-height: 1.5;
  resize: vertical;
}

.cfg-check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
  font-weight: 500;
}

.cfg-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary);
}

.cfg-hint {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: var(--text-xs);
}

.cfg-error {
  margin-bottom: var(--space-3);
  color: var(--danger);
  font-size: var(--text-xs);
}
</style>
