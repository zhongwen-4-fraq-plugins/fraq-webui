<script setup>
import { reactive, watch } from 'vue'
import { store } from '../services/store.js'
import ConfirmDialog from './ConfirmDialog.vue'
import LogColorRow from './LogColorRow.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open'])

const logColors = reactive(JSON.parse(JSON.stringify(store.state.appearance.logColors)))

// 打开时同步最新保存值
watch(
  () => props.open,
  (open) => {
    if (open) {
      Object.assign(logColors, JSON.parse(JSON.stringify(store.state.appearance.logColors)))
    }
  },
)

watch(
  logColors,
  () => {
    store.setAppearance({
      ...JSON.parse(JSON.stringify(store.state.appearance)),
      logColors: JSON.parse(JSON.stringify(logColors)),
    })
  },
  { deep: true },
)
</script>

<template>
  <ConfirmDialog
    :open="open"
    title="日志颜色"
    confirm-label="完成"
    @update:open="emit('update:open', $event)"
    @confirm="emit('update:open', false)"
  >
    <div class="log-colors">
      <LogColorRow label="错误" :model="logColors.error" />
      <LogColorRow label="警告" :model="logColors.warn" />
      <LogColorRow label="信息" :model="logColors.info" />
      <LogColorRow label="调试" :model="logColors.debug" />
    </div>
    <p class="log-colors__hint">文字颜色与底色即时生效并自动保存；底色透明度 0 表示无底色。</p>
  </ConfirmDialog>
</template>

<style scoped>
.log-colors {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.log-colors__hint {
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: var(--text-xs);
}
</style>
