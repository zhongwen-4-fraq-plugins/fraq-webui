<script setup>
import IconAlertCircle from '~icons/tabler/alert-circle'
import AppButton from './AppButton.vue'

defineProps({
  message: { type: String, required: true },
})

defineEmits(['retry'])
</script>

<template>
  <div class="error-banner" role="alert">
    <IconAlertCircle class="error-banner__icon" aria-hidden="true" />
    <span class="error-banner__message">{{ message }}</span>
    <AppButton variant="ghost" size="sm" class="error-banner__retry" @click="$emit('retry')">
      重试
    </AppButton>
  </div>
</template>

<style scoped>
/* 错误横幅：浅红底 + 图标 + 信息 + 重试按钮 */
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2); /* 元素间间距 */
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--danger-soft); /* 危险浅底 */
}

/* 左侧警示图标 */
.error-banner__icon {
  width: 1rem;
  height: 1rem;
  color: var(--danger); /* 图标用危险色 */
  flex-shrink: 0; /* 不随内容挤压 */
}

/* 错误信息：占满剩余宽度，超长省略 */
.error-banner__message {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
}

/* 重试按钮：不收缩 */
.error-banner__retry {
  flex-shrink: 0;
}
</style>
