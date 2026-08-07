<script setup>
import IconBlocks from '~icons/tabler/blocks'
import IconLayoutDashboard from '~icons/tabler/layout-dashboard'
import IconListDetails from '~icons/tabler/list-details'
import IconSettings from '~icons/tabler/settings'
import IconX from '~icons/tabler/x'
import { APP_NAME } from '../core/config.js'
import { store } from '../services/store.js'

defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])

const navItems = [
  { to: '/', label: '概览', icon: IconLayoutDashboard },
  { to: '/plugins', label: '插件', icon: IconBlocks },
  { to: '/logs', label: '日志', icon: IconListDetails, settings: true },
  { to: '/settings', label: '设置', icon: IconSettings },
]
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': open }" aria-label="主导航">
    <div class="sidebar__brand">
      <span class="sidebar__logo" aria-hidden="true">F</span>
      <span class="sidebar__name">{{ APP_NAME }}</span>
      <button
        type="button"
        class="sidebar__close"
        aria-label="关闭导航"
        @click="$emit('close')"
      >
        <IconX aria-hidden="true" />
      </button>
    </div>

    <nav class="sidebar__nav">
      <div v-for="item in navItems" :key="item.to" class="sidebar__row">
        <RouterLink
          :to="item.to"
          class="sidebar__link"
          exact-active-class="sidebar__link--active"
          @click="$emit('close')"
        >
          <component :is="item.icon" class="sidebar__icon" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
        <button
          v-if="item.settings"
          type="button"
          class="sidebar__gear"
          aria-label="日志颜色设置"
          title="日志颜色设置"
          @click="store.state.logColorsOpen = true"
        >
          <IconSettings aria-hidden="true" />
        </button>
      </div>
    </nav>

    <p class="sidebar__footer">演示模式 · 数据为模拟</p>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  width: 15rem;
  background: var(--app-sidebar-bg, oklch(0.984 0.003 210 / 0.72));
  -webkit-backdrop-filter: blur(var(--app-sidebar-blur, 16px)) saturate(1.5);
  backdrop-filter: blur(var(--app-sidebar-blur, 16px)) saturate(1.5);
  transform: translateX(-100%);
  transition: transform 200ms ease-out;
}

.sidebar--open {
  transform: translateX(0);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 3.5rem;
  padding: 0 var(--space-4);
}

.sidebar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 700;
}

.sidebar__name {
  font-weight: 600;
  font-size: var(--text-sm);
}

.sidebar__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin-left: auto;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.sidebar__close:hover {
  background: var(--surface-2);
  color: var(--app-text-color, var(--ink));
}

.sidebar__close svg {
  width: 1.125rem;
  height: 1.125rem;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
}

.sidebar__row {
  position: relative;
  display: flex;
  align-items: center;
}

.sidebar__row .sidebar__link {
  flex: 1;
}

.sidebar__gear {
  position: absolute;
  right: var(--space-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.sidebar__gear:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.sidebar__gear svg {
  width: 1rem;
  height: 1rem;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--muted);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out;
}

.sidebar__link:hover {
  background: transparent;
  color: var(--app-text-color, var(--ink));
}

.sidebar__link--active {
  background: transparent;
  color: var(--primary);
  font-weight: 600;
}

.sidebar__link--active:hover {
  background: transparent;
  color: var(--primary);
}

.sidebar__icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.sidebar__footer {
  margin-top: auto;
  padding: var(--space-4);
  color: var(--faint);
  font-size: var(--text-xs);
}

@media (min-width: 900px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    transform: none;
    transition: none;
  }

  .sidebar__close {
    display: none;
  }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .sidebar {
    background: var(--surface);
  }
}
</style>
