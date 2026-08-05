<script setup>
import { ref, watch } from 'vue'
import AppButton from './AppButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, default: '取消' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:open', 'confirm', 'cancel'])
const dialogRef = ref(null)

watch(
  () => props.open,
  async (open) => {
    const dialog = dialogRef.value
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  },
)

function onCancel() {
  emit('update:open', false)
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <dialog ref="dialogRef" class="dialog" @cancel.prevent="onCancel">
    <div class="dialog__body">
      <h2 class="dialog__title">{{ title }}</h2>
      <div class="dialog__content">
        <slot />
      </div>
      <div class="dialog__actions">
        <AppButton :autofocus="!danger" variant="secondary" @click="onCancel">
          {{ cancelLabel }}
        </AppButton>
        <AppButton
          :variant="danger ? 'danger' : 'primary'"
          :loading="loading"
          :autofocus="danger"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </AppButton>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(28rem, calc(100vw - 2rem));
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}

.dialog::backdrop {
  background: oklch(0.22 0.015 220 / 0.35);
}

.dialog__body {
  padding: var(--space-5);
}

.dialog__title {
  font-size: var(--text-lg);
  font-weight: 600;
}

.dialog__content {
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: var(--text-sm);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
</style>
