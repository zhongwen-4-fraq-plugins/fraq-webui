<script setup>
defineProps({
  tone: { type: String, default: 'neutral' }, // success | warning | danger | info | neutral
  dot: { type: Boolean, default: true },
})
</script>

<template>
  <span class="badge" :class="`badge--${tone}`">
    <span v-if="dot" class="badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}

.badge--success {
  color: var(--success);
}

.badge--warning {
  color: var(--warning-text);
}

.badge--danger {
  color: var(--danger);
}

.badge--info {
  color: var(--primary);
}

.badge--neutral {
  color: var(--muted);
}

.badge__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}
</style>
