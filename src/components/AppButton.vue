<script setup>
import IconLoader from '~icons/tabler/loader-2'

defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger | danger-ghost
  size: { type: String, default: 'md' }, // md | sm | icon
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  href: { type: String, default: '' },
  target: { type: String, default: '' },
})

defineEmits(['click'])
</script>

<template>
  <a
    v-if="href"
    :href="href"
    :target="target"
    :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`]"
  >
    <IconLoader v-if="loading" class="btn__spinner" aria-hidden="true" />
    <span v-show="!(size === 'icon' && loading)"><slot /></span>
  </a>
  <button
    v-else
    :type="type"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`]"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :autofocus="autofocus"
    @click="$emit('click', $event)"
  >
    <IconLoader v-if="loading" class="btn__spinner" aria-hidden="true" />
    <span v-show="!(size === 'icon' && loading)"><slot /></span>
  </button>
</template>

<style scoped>
/* 按钮基础：inline-flex 让图标与文字垂直居中，统一圆角与过渡 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2); /* 图标与文字间距 */
  border: 1px solid transparent; /* 占位边框，悬停时变边框色 */
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none; /* 链接形态按钮去掉下划线 */
  /* 背景、边框、文字色统一做过渡 */
  transition:
    background-color 150ms ease-out,
    border-color 150ms ease-out,
    color 150ms ease-out;
}

/* 禁用态：不可点击 + 半透明 */
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55; /* 弱化视觉 */
}

/* 中等尺寸（默认） */
.btn--md {
  min-height: 2.5rem; /* 保证最小点击高度 */
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
}

/* 小尺寸（工具栏、行内操作） */
.btn--sm {
  min-height: 2rem;
  padding: 0 var(--space-3);
  font-size: var(--text-xs); /* 更小字号 */
}

/* 纯图标按钮：正方形、无内边距 */
.btn--icon {
  position: relative;
  width: 2.25rem; /* 36px */
  height: 2.25rem;
  padding: 0;
}

/* 扩大触控命中区域到 44px，视觉尺寸保持不变 */
.btn--icon::before {
  content: '';
  position: absolute;
  inset: -4px; /* 四周各扩 4px */
}

/* 图标按钮内的图标统一 18px */
.btn--icon svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* 文字按钮里的图标统一收敛到 18px，避免默认 24px 与文字错位 */
.btn > span > svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* 图标与文字共用一个 span：用 flex 垂直居中并对齐间距 */
.btn > span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

/* 主按钮：主色实底 + 白字保证对比度 */
.btn--primary {
  background: var(--primary);
  color: #fff;
}

/* 主按钮悬停：加深 */
.btn--primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

/* 主按钮按下：进一步加深 */
.btn--primary:active:not(:disabled) {
  background: var(--primary-active);
}

/* 次级按钮：浅色底 + 正文文字色，底色跟随组件外观 */
.btn--secondary {
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
}

/* 次级按钮悬停：用边框色做底 */
.btn--secondary:hover:not(:disabled) {
  background: var(--border);
}

/* 幽灵按钮：透明底 + 正文文字色 */
.btn--ghost {
  background: var(--app-component-bg, transparent);
  color: var(--app-text-color, var(--ink));
}

/* 幽灵按钮悬停：文字色 10% 混入做底 */
.btn--ghost:hover:not(:disabled) {
  background: color-mix(in srgb, var(--ink) 10%, var(--app-component-bg, var(--surface-2)));
}

/* 危险按钮：红底白字 */
.btn--danger {
  background: var(--danger);
  color: #fff;
}

/* 危险按钮悬停 */
.btn--danger:hover:not(:disabled) {
  background: var(--danger-hover);
}

/* 危险幽灵按钮：透明底 + 红色文字 */
.btn--danger-ghost {
  background: var(--app-component-bg, transparent);
  color: var(--danger);
}

/* 危险幽灵按钮悬停：红色浅底 */
.btn--danger-ghost:hover:not(:disabled) {
  background: var(--danger-soft);
}

/* 加载中旋转图标 */
.btn__spinner {
  width: 1em; /* 跟随当前字号 */
  height: 1em;
  animation: btn-spin 0.8s linear infinite; /* 匀速旋转 */
}

/* 旋转动画 */
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 触屏设备：中等按钮加高，方便手指点击 */
@media (pointer: coarse) {
  .btn--md {
    min-height: 2.75rem;
  }
}
</style>
