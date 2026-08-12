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
/* 提示容器：固定在右上角，纵向堆叠多条提示；自身不拦截点击 */
.toast-host {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-toast); /* 最高层级 */
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(24rem, calc(100vw - 2rem)); /* 窄屏不超出视口 */
  pointer-events: none; /* 点击穿透，只有提示条本身可点 */
}

/* 单条提示：毛玻璃卡片，底部有进度条，允许点击 */
.toast {
  position: relative;
  overflow: hidden; /* 裁掉进度条以外的溢出 */
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--bg)); /* 组件底色，跟随外观 */
  -webkit-backdrop-filter: blur(var(--app-component-blur, 0px)) saturate(1.4); /* 毛玻璃 */
  backdrop-filter: blur(var(--app-component-blur, 0px)) saturate(1.4);
  box-shadow: var(--shadow-sm);
  font-size: var(--text-sm);
  pointer-events: auto; /* 提示条本身恢复可点击 */
}

/* 左侧状态图标 */
.toast__icon {
  width: 1rem;
  height: 1rem;
  margin-top: 2px; /* 与首行文字对齐 */
  flex-shrink: 0;
}

/* 成功提示图标：绿色 */
.toast--success .toast__icon {
  color: var(--success);
}

/* 错误提示图标：红色 */
.toast--error .toast__icon {
  color: var(--danger);
}

/* 信息提示图标：主色 */
.toast--info .toast__icon {
  color: var(--primary);
}

/* 为进度条准备各自的状态色变量 */
.toast--success {
  --toast-color: var(--success);
}

.toast--error {
  --toast-color: var(--danger);
}

.toast--info {
  --toast-color: var(--primary);
}

/* 提示文字：占满剩余宽度 */
.toast__message {
  flex: 1;
  min-width: 0;
}

/* 底部进度条：从左侧 0 生长到 100%，颜色从浅到深 */
.toast__progress {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px; /* 细进度条 */
  transform-origin: left; /* 从左往右生长 */
  transform: scaleX(0); /* 初始宽度为 0 */
  animation-name: toast-fill; /* 由时长动画驱动 */
  animation-timing-function: linear; /* 匀速 */
  animation-fill-mode: forwards; /* 结束后保持最终状态 */
}

/* 从左往右生长，同时颜色由浅变深，时长跟随提示显示时间 */
@keyframes toast-fill {
  from {
    transform: scaleX(0); /* 起始：不可见 */
    background: color-mix(in srgb, var(--toast-color) 35%, white); /* 起始：浅色 */
  }
  to {
    transform: scaleX(1); /* 结束：满宽 */
    background: var(--toast-color); /* 结束：状态色 */
  }
}

/* 关闭按钮：小方形透明底 */
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

/* 关闭按钮悬停：浅色底 */
.toast__close:hover {
  background: var(--surface-2);
  color: var(--app-text-color, var(--ink));
}

/* 关闭图标尺寸 */
.toast__close svg {
  width: 1rem;
  height: 1rem;
}

/* 进出场动画：透明度 + 垂直位移 */
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms ease-out;
}

/* 入场起始：透明并上移 */
.toast-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* 离场结束：透明并上移 */
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* 减少动效偏好：关掉进度条动画 */
@media (prefers-reduced-motion: reduce) {
  .toast__progress {
    animation: none;
  }
}

/* 窄屏：提示移到右下角 */
@media (max-width: 640px) {
  .toast-host {
    top: auto; /* 取消顶部定位 */
    bottom: var(--space-4); /* 改为底部 */
    right: var(--space-4);
  }
}
</style>
