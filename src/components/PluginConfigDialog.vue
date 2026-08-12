<script setup>
import { ref, watch } from 'vue'
import { NButton, NIcon, NInput, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { X } from '@vicons/tabler'
import { httpApi } from '../services/httpApi.js'
import {
  AI_SDK_OPTIONS,
  getPluginSchema,
  getByPath,
  setByPath,
  deleteByPath,
} from '../data/pluginSchemas.js'
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

function splitLines(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function providersToRows(value) {
  return Object.entries(value ?? {}).map(([name, item]) => ({
    name,
    sdk: item?.sdk ?? '',
    apiKey: item?.options?.apiKey ?? '',
    baseURL: item?.options?.baseURL ?? '',
    models: Array.isArray(item?.models) ? item.models.join('\n') : '',
    images: Array.isArray(item?.images) ? item.images.join('\n') : '',
  }))
}

function rowsToProviders(rows) {
  const out = {}
  for (const row of rows) {
    const name = row.name.trim()
    if (!name || !row.sdk) continue
    const provider = { sdk: row.sdk, options: {}, models: splitLines(row.models) }
    if (row.apiKey.trim()) {
      provider.options.apiKey = row.apiKey.trim()
    }
    if (row.baseURL.trim()) {
      provider.options.baseURL = row.baseURL.trim()
    }
    const images = splitLines(row.images)
    if (images.length) {
      provider.images = images
    }
    out[name] = provider
  }
  return out
}

function addProvider(key) {
  form.value[key].push({
    name: '',
    sdk: '@ai-sdk/openai-compatible',
    apiKey: '',
    baseURL: '',
    models: '',
    images: '',
  })
}

function sdkOptions() {
  return AI_SDK_OPTIONS.map((option) => ({
    label: `${option.label}（${option.value}）`,
    value: option.value,
  }))
}

function selectOptions(field) {
  return [{ label: '默认', value: '' }, ...(field.options ?? [])]
}

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
          if (field.type === 'providers') {
            form.value[field.key] = providersToRows(value)
          } else if (field.type === 'json') {
            form.value[field.key] = JSON.stringify(value ?? {}, null, 2)
          } else if (field.type === 'boolean') {
            form.value[field.key] = value ?? false
          } else if (field.type === 'number') {
            form.value[field.key] = value ?? null
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
        if (field.type === 'providers') {
          const parsed = rowsToProviders(form.value[field.key])
          if (Object.keys(parsed).length > 0) {
            setByPath(config, field.key, parsed)
          } else {
            deleteByPath(config, field.key)
          }
        } else if (field.type === 'json') {
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
            <label class="cfg-check">
              <NSwitch v-model:value="form[field.key]" size="small" />
              <span>{{ field.label }}</span>
            </label>
          </template>
          <template v-else-if="field.type === 'providers'">
            <span class="cfg-label">{{ field.label }}</span>
            <div class="cfg-providers">
              <div
                v-for="(provider, index) in form[field.key]"
                :key="index"
                class="cfg-provider"
              >
                <div class="cfg-provider__head">
                  <NInput
                    v-model:value="provider.name"
                    placeholder="提供商名称，如 akile"
                    aria-label="提供商名称"
                  />
                  <NButton
                    quaternary
                    circle
                    size="small"
                    :aria-label="`删除提供商 ${provider.name || index + 1}`"
                    title="删除"
                    @click="form[field.key].splice(index, 1)"
                  >
                    <template #icon>
                      <NIcon><X /></NIcon>
                    </template>
                  </NButton>
                </div>
                <label class="cfg-label" :for="`cfg-${field.key}-${index}-sdk`">SDK</label>
                <NSelect
                  :id="`cfg-${field.key}-${index}-sdk`"
                  v-model:value="provider.sdk"
                  :options="sdkOptions()"
                />
                <label class="cfg-label" :for="`cfg-${field.key}-${index}-key`">API Key</label>
                <NInput
                  :id="`cfg-${field.key}-${index}-key`"
                  v-model:value="provider.apiKey"
                  type="password"
                  show-password-on="click"
                  autocomplete="off"
                  placeholder="sk-..."
                />
                <label class="cfg-label" :for="`cfg-${field.key}-${index}-url`">Base URL</label>
                <NInput
                  :id="`cfg-${field.key}-${index}-url`"
                  v-model:value="provider.baseURL"
                  placeholder="https://api.example.com/v1"
                />
                <label class="cfg-label" :for="`cfg-${field.key}-${index}-models`">
                  模型列表
                </label>
                <NInput
                  :id="`cfg-${field.key}-${index}-models`"
                  v-model:value="provider.models"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  placeholder="每行一个模型，如 gpt-5.6-sol"
                />
                <label class="cfg-label" :for="`cfg-${field.key}-${index}-images`">
                  生图模型（可选）
                </label>
                <NInput
                  :id="`cfg-${field.key}-${index}-images`"
                  v-model:value="provider.images"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  placeholder="每行一个生图模型"
                />
              </div>
              <NButton size="small" @click="addProvider(field.key)">添加提供商</NButton>
            </div>
          </template>
          <template v-else>
            <label class="cfg-label" :for="`cfg-${field.key}`">{{ field.label }}</label>
            <NInput
              v-if="field.type === 'text' || field.type === 'password'"
              :id="`cfg-${field.key}`"
              v-model:value="form[field.key]"
              :type="field.type"
              show-password-on="click"
              :placeholder="field.placeholder"
              autocomplete="off"
            />
            <NInputNumber
              v-else-if="field.type === 'number'"
              :id="`cfg-${field.key}`"
              v-model:value="form[field.key]"
              :placeholder="field.placeholder"
              style="width: 100%"
            />
            <NSelect
              v-else-if="field.type === 'select'"
              :id="`cfg-${field.key}`"
              v-model:value="form[field.key]"
              :options="selectOptions(field)"
            />
            <NInput
              v-else-if="field.type === 'json'"
              :id="`cfg-${field.key}`"
              v-model:value="form[field.key]"
              type="textarea"
              :autosize="{ minRows: 7, maxRows: 16 }"
              spellcheck="false"
            />
          </template>
          <p v-if="field.hint" class="cfg-hint">{{ field.hint }}</p>
        </div>
        <p class="cfg-hint">保存后需重启核心才能生效；密钥字段显示为 ******，未改动会保留原值。</p>
      </div>

      <div v-else class="cfg-field">
        <label class="cfg-label" for="cfg-json">配置（JSON）</label>
        <NInput
          id="cfg-json"
          v-model:value="jsonText"
          type="textarea"
          :autosize="{ minRows: 12, maxRows: 24 }"
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

.cfg-check {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
}

.cfg-providers {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cfg-provider {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
}

.cfg-provider__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cfg-provider__head .n-input {
  flex: 1;
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
