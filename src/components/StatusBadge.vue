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
/* 状态徽标：小号文字 + 可选圆点，横向排列 */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1); /* 文字与圆点间距 */
  font-size: var(--text-xs); /* 小号辅助字号 */
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap; /* 不让徽标换行 */
}

/* 不同状态对应的文字颜色 */
.badge--success {
  color: var(--success);
}

/* 警告用专门文字色，保证浅底对比度 */
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

/* 状态圆点：使用当前文字颜色 */
.badge__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%; /* 圆形 */
  background: currentColor; /* 跟随文字色 */
}
</style>
