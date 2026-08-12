<script setup>
defineProps({
  lines: { type: Number, default: 1 },
})
</script>

<template>
  <div class="skeleton" aria-hidden="true">
    <div v-for="index in lines" :key="index" class="skeleton__line" :style="{ width: `${100 - index * 12}%` }" />
  </div>
</template>

<style scoped>
/* 骨架屏：一串灰色占位条，纵向排列 */
.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2); /* 条与条间距 */
}

/* 每条占位条：浅灰背景 + 圆角 */
.skeleton__line {
  height: 0.875rem; /* 模拟一行文字的高度 */
  border-radius: var(--radius-sm);
  background: var(--surface-2); /* 比面板稍深的浅灰 */
}
</style>
