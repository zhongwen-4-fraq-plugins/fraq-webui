<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="page-header">
    <div>
      <h2 class="page-header__title">{{ title }}</h2>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="page-header__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.page-header__title {
  font-size: var(--text-xl);
  font-weight: 600;
}

.page-header__description {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: var(--text-sm);
  max-width: 60ch;
}

.page-header__action {
  flex-shrink: 0;
}
</style>
