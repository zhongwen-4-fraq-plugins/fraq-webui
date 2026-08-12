<script setup>
import { NButton, NModal } from 'naive-ui'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, default: '取消' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'confirm', 'cancel'])

function onCancel() {
  emit('update:open', false)
  emit('cancel')
}
</script>

<template>
  <NModal
    preset="card"
    :show="open"
    :title="title"
    :bordered="false"
    :style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
    @update:show="$emit('update:open', $event)"
  >
    <div class="confirm-dialog__content">
      <slot />
    </div>
    <template #footer>
      <div class="confirm-dialog__actions">
        <NButton @click="onCancel">{{ cancelLabel }}</NButton>
        <NButton
          :type="danger ? 'error' : 'primary'"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
:deep(.n-card) {
  --n-color: var(--app-dialog-bg, oklch(1 0 0 / 0.92));
  -webkit-backdrop-filter: blur(var(--app-dialog-blur, 16px)) saturate(1.4);
  backdrop-filter: blur(var(--app-dialog-blur, 16px)) saturate(1.4);
  box-shadow: var(--shadow-sm);
}

.confirm-dialog__content {
  color: var(--muted);
  font-size: var(--text-sm);
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
