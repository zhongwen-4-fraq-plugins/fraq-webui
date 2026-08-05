<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <slot name="icon">
      <div class="empty__icon" aria-hidden="true" />
    </slot>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="description" class="empty__description">{{ description }}</p>
    <div v-if="$slots.action" class="empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-5);
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
}

.empty__icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: var(--primary-soft);
}

.empty__title {
  margin-top: var(--space-4);
  font-size: var(--text-base);
  font-weight: 600;
}

.empty__description {
  margin-top: var(--space-2);
  color: var(--muted);
  font-size: var(--text-sm);
  max-width: 34ch;
}

.empty__action {
  margin-top: var(--space-5);
}
</style>
