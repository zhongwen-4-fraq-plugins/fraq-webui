<script setup>
import { NEmpty } from 'naive-ui'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <NEmpty size="large" class="empty-state">
    <template #icon>
      <slot name="icon" />
    </template>
    <template #default>
      <p class="empty-state__title">{{ title }}</p>
      <p v-if="description" class="empty-state__description">{{ description }}</p>
    </template>
    <template #extra>
      <slot name="action" />
    </template>
  </NEmpty>
</template>

<style scoped>
.empty-state {
  padding: var(--space-8) var(--space-5);
}

.empty-state__title {
  font-size: var(--text-base);
  font-weight: 600;
}

.empty-state__description {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: var(--text-sm);
}
</style>
