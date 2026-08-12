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
/* 页面标题栏：标题居左，操作按钮居右 */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between; /* 两端对齐 */
  gap: var(--space-4);
  margin-bottom: var(--space-6); /* 与下方内容拉开距离 */
}

/* 标题 */
.page-header__title {
  font-size: var(--text-xl);
  font-weight: 600;
}

/* 描述：次要文字色，限宽保证换行美观 */
.page-header__description {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: var(--text-sm);
  max-width: 60ch; /* 约 60 个字符宽 */
}

/* 右侧操作区：不收缩 */
.page-header__action {
  flex-shrink: 0;
}
</style>
