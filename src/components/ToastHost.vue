<script setup>
import IconAlertCircle from '~icons/tabler/alert-circle'
import IconCheckCircle from '~icons/tabler/circle-check'
import IconInfo from '~icons/tabler/info-circle'
import IconX from '~icons/tabler/x'
import { store } from '../services/store.js'
import { TOAST_DURATION_MS } from '../core/config.js'
</script>

<template>
  <div class="toast-host" aria-live="polite" role="status">
    <TransitionGroup name="toast">
      <div v-for="item in store.state.toasts" :key="item.id" class="toast" :class="`toast--${item.type}`">
        <IconCheckCircle v-if="item.type === 'success'" class="toast__icon" aria-hidden="true" />
        <IconAlertCircle v-else-if="item.type === 'error'" class="toast__icon" aria-hidden="true" />
        <IconInfo v-else class="toast__icon" aria-hidden="true" />
        <span class="toast__message">{{ item.message }}</span>
        <button
          type="button"
          class="toast__close"
          aria-label="关闭通知"
          @click="store.dismissToast(item.id)"
        >
          <IconX aria-hidden="true" />
        </button>
        <span
          class="toast__progress"
          :style="{ animationDuration: `${TOAST_DURATION_MS}ms` }"
          aria-hidden="true"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(24rem, calc(100vw - 2rem));
  pointer-events: none;
}

.toast {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--bg));
  -webkit-backdrop-filter: blur(var(--app-component-blur, 0px)) saturate(1.4);
  backdrop-filter: blur(var(--app-component-blur, 0px)) saturate(1.4);
  box-shadow: var(--shadow-sm);
  font-size: var(--text-sm);
  pointer-events: auto;
}

.toast__icon {
  width: 1rem;
  height: 1rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.toast--success .toast__icon {
  color: var(--success);
}

.toast--error .toast__icon {
  color: var(--danger);
}

.toast--info .toast__icon {
  color: var(--primary);
}

.toast--success {
  --toast-color: var(--success);
}

.toast--error {
  --toast-color: var(--danger);
}

.toast--info {
  --toast-color: var(--primary);
}

.toast__message {
  flex: 1;
  min-width: 0;
}

.toast__progress {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  transform-origin: left;
  transform: scaleX(0);
  animation-name: toast-fill;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

/* 从左往右生长，同时颜色由浅变深，时长跟随提示显示时间 */
@keyframes toast-fill {
  from {
    transform: scaleX(0);
    background: color-mix(in srgb, var(--toast-color) 35%, white);
  }
  to {
    transform: scaleX(1);
    background: var(--toast-color);
  }
}

.toast__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
}

.toast__close:hover {
  background: var(--surface-2);
  color: var(--app-text-color, var(--ink));
}

.toast__close svg {
  width: 1rem;
  height: 1rem;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms ease-out;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .toast__progress {
    animation: none;
  }
}

@media (max-width: 640px) {
  .toast-host {
    top: auto;
    bottom: var(--space-4);
    right: var(--space-4);
  }
}
</style>
