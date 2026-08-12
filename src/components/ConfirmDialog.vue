<script setup>
import { onMounted, ref, watch } from 'vue'
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

// 防御：组件挂载时 open 已是 true（如 v-if 首次渲染）也正常打开
onMounted(() => {
  if (props.open && dialogRef.value && !dialogRef.value.open) {
    dialogRef.value.showModal()
  }
})

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
/* 确认弹窗：半透明毛玻璃卡片，宽不超过视口 */
.dialog {
  width: min(28rem, calc(100vw - 2rem)); /* 固定 28rem，窄屏不超出视口 */
  padding: 0; /* 内边距交给 body 控制 */
  border: none; /* 去掉原生边框 */
  border-radius: var(--radius-lg);
  background: var(--app-dialog-bg, oklch(1 0 0 / 0.92)); /* 弹窗底色可被外观设置覆盖 */
  -webkit-backdrop-filter: blur(var(--app-dialog-blur, 16px)) saturate(1.4); /* 毛玻璃模糊 */
  backdrop-filter: blur(var(--app-dialog-blur, 16px)) saturate(1.4);
  color: var(--app-text-color, var(--ink));
  box-shadow: var(--shadow-sm);
}

/* 弹窗外遮罩：半透明深色 */
.dialog::backdrop {
  background: oklch(0.22 0.015 220 / 0.35);
}

/* 弹窗内容区统一内边距 */
.dialog__body {
  padding: var(--space-5);
}

/* 弹窗标题 */
.dialog__title {
  font-size: var(--text-lg);
  font-weight: 600;
}

/* 正文区：次要文字色 */
.dialog__content {
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: var(--text-sm);
}

/* 底部按钮：右对齐 */
.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3); /* 取消/确认按钮间距 */
  margin-top: var(--space-5);
}
</style>
