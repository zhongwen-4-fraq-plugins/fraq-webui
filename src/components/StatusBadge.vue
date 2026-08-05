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
  gap: var(--space-2);
  padding: 2px var(--space-2);
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
}

.badge--success {
  background: var(--success-soft);
  color: var(--ink);
}

.badge--warning {
  background: var(--warning-soft);
  color: var(--ink);
}

.badge--danger {
  background: var(--danger-soft);
  color: var(--ink);
}

.badge--info {
  background: var(--info-soft);
  color: var(--ink);
}

.badge--neutral {
  background: var(--surface-2);
  color: var(--muted);
}

.badge__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}

.badge--success .badge__dot {
  background: var(--success);
}

.badge--warning .badge__dot {
  background: var(--warning);
}

.badge--danger .badge__dot {
  background: var(--danger);
}

.badge--info .badge__dot {
  background: var(--primary);
}

.badge--neutral .badge__dot {
  background: var(--muted);
}
</style>
