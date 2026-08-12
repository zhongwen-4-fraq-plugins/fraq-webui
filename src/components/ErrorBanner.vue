<script setup>
import { NAlert, NButton } from 'naive-ui'

defineProps({
  message: { type: String, required: true },
})

defineEmits(['retry'])
</script>

<template>
  <NAlert type="error" class="error-banner">
    <div class="error-banner__body">
      <span class="error-banner__message">{{ message }}</span>
      <NButton size="small" quaternary @click="$emit('retry')">重试</NButton>
    </div>
  </NAlert>
</template>

<style scoped>
.error-banner {
  margin-bottom: var(--space-5);
}

.error-banner__body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.error-banner__message {
  flex: 1;
  min-width: 0;
}
</style>
