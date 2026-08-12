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
/* 空状态：垂直居中排列图标、标题、说明、操作按钮 */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-5); /* 上下 左右 */
  text-align: center; /* 文字居中 */
  border-radius: var(--radius-lg);
}

/* 默认图标占位块（未提供图标时显示） */
.empty__icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: var(--primary-soft); /* 主色浅底 */
}

/* 空状态标题 */
.empty__title {
  margin-top: var(--space-4);
  font-size: var(--text-base);
  font-weight: 600;
}

/* 空状态说明文字：限宽保证换行美观 */
.empty__description {
  margin-top: var(--space-2);
  color: var(--muted); /* 次要文字色 */
  font-size: var(--text-sm);
  max-width: 34ch; /* 约 34 个字符宽 */
}

/* 操作按钮区域 */
.empty__action {
  margin-top: var(--space-5);
}
</style>
