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
.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--danger-soft);
}

.error-banner__icon {
  width: 1rem;
  height: 1rem;
  color: var(--danger);
  flex-shrink: 0;
}

.error-banner__message {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
}

.error-banner__retry {
  flex-shrink: 0;
}
</style>
