<script setup>
import { LoaderCircle } from '@lucide/vue'

defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger | danger-ghost
  size: { type: String, default: 'md' }, // md | sm | icon
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`]"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :autofocus="autofocus"
    @click="$emit('click', $event)"
  >
    <LoaderCircle v-if="loading" class="btn__spinner" aria-hidden="true" />
    <span v-show="!(size === 'icon' && loading)"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 150ms ease-out,
    border-color 150ms ease-out,
    color 150ms ease-out;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.btn--md {
  min-height: 2.5rem;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
}

.btn--sm {
  min-height: 2rem;
  padding: 0 var(--space-3);
  font-size: var(--text-xs);
}

.btn--icon {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
}

/* 扩大触控命中区域到 44px，视觉尺寸保持不变 */
.btn--icon::before {
  content: '';
  position: absolute;
  inset: -4px;
}

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

.btn--primary {
  background: var(--primary);
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn--primary:active:not(:disabled) {
  background: var(--primary-active);
}

.btn--secondary {
  background: var(--bg);
  border-color: var(--border);
  color: var(--ink);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--surface);
  border-color: var(--faint);
}

.btn--ghost {
  background: transparent;
  color: var(--ink);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--surface-2);
}

.btn--danger {
  background: var(--danger);
  color: #fff;
}

.btn--danger:hover:not(:disabled) {
  background: var(--danger-hover);
}

.btn--danger-ghost {
  background: transparent;
  color: var(--danger);
}

.btn--danger-ghost:hover:not(:disabled) {
  background: var(--danger-soft);
}

.btn__spinner {
  width: 1em;
  height: 1em;
  animation: btn-spin 0.8s linear infinite;
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (pointer: coarse) {
  .btn--md {
    min-height: 2.75rem;
  }
}
</style>
