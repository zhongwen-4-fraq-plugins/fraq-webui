<script setup>
import IconBlocks from '~icons/tabler/blocks'
import IconLayoutDashboard from '~icons/tabler/layout-dashboard'
import IconListDetails from '~icons/tabler/list-details'
import IconLoader from '~icons/tabler/loader-2'
import IconRefresh from '~icons/tabler/refresh'
import IconSettings from '~icons/tabler/settings'
import IconTool from '~icons/tabler/tool'
import IconX from '~icons/tabler/x'
import { ref } from 'vue'
import { APP_NAME, APP_VERSION } from '../core/config.js'
import { httpApi } from '../services/httpApi.js'
import { store } from '../services/store.js'

defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])

const checking = ref(false)

async function checkUpdate() {
  if (checking.value) return
  checking.value = true
  try {
    const result = await httpApi.checkUpdates()
    if (result.upToDate) {
      store.toast('success', `已是最新版本（v${APP_VERSION}）`)
    } else {
      store.toast('warning', `发现 ${result.behind} 个新提交，可在项目目录执行 git pull 更新`)
    }
  } catch (error) {
    store.toast('error', error instanceof Error ? error.message : '检查更新失败')
  } finally {
    checking.value = false
  }
}

const navItems = [
  { to: '/', label: '概览', icon: IconLayoutDashboard },
  { to: '/plugins', label: '插件', icon: IconBlocks },
  { to: '/install', label: '安装', icon: IconTool },
  { to: '/logs', label: '日志', icon: IconListDetails },
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
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__link"
        exact-active-class="sidebar__link--active"
        @click="$emit('close')"
      >
        <component :is="item.icon" class="sidebar__icon" aria-hidden="true" />
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="sidebar__footer">
      <span class="sidebar__version">fraq-webui v{{ APP_VERSION }}</span>
      <button
        type="button"
        class="sidebar__update"
        :disabled="checking"
        :aria-label="checking ? '正在检查更新' : '检查更新'"
        @click="checkUpdate"
      >
        <IconRefresh v-if="!checking" class="sidebar__update-icon" aria-hidden="true" />
        <IconLoader v-else class="sidebar__update-icon sidebar__update-icon--spin" aria-hidden="true" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* 侧边栏：窄屏为左侧抽屉（默认移出屏幕），宽屏为常驻栏 */
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

/* 打开状态：滑入屏幕 */
.sidebar--open {
  transform: translateX(0);
}

/* 顶部品牌区 */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 3.5rem;
  padding: 0 var(--space-4);
}

/* 品牌方块：主色底 + 白色 F */
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

/* 应用名 */
.sidebar__name {
  font-weight: 600;
  font-size: var(--text-sm);
}

/* 关闭按钮（仅窄屏显示）：推到最右 */
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

/* 关闭按钮悬停 */
.sidebar__close:hover {
  background: var(--surface-2);
  color: var(--app-text-color, var(--ink));
}

/* 关闭图标尺寸 */
.sidebar__close svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* 导航区：纵向排列 */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
}


/* 导航链接 */
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

/* 悬停：文字变正文色 */
.sidebar__link:hover {
  background: transparent;
  color: var(--app-text-color, var(--ink));
}

/* 当前页：主色 + 加粗 */
.sidebar__link--active {
  background: transparent;
  color: var(--primary);
  font-weight: 600;
}

/* 当前页悬停：保持主色 */
.sidebar__link--active:hover {
  background: transparent;
  color: var(--primary);
}

/* 导航图标 */
.sidebar__icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

/* 底部：版本号 + 检查更新，推到最底 */
.sidebar__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  padding: var(--space-4);
  color: var(--faint);
  font-size: var(--text-xs);
}

/* 版本号不换行 */
.sidebar__version {
  white-space: nowrap;
}

/* 检查更新按钮 */
.sidebar__update {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--faint);
  cursor: pointer;
}

/* 更新按钮悬停（非禁用时） */
.sidebar__update:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--app-text-color, var(--ink));
}

/* 更新按钮禁用（检查中） */
.sidebar__update:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 更新图标尺寸 */
.sidebar__update-icon {
  width: 1rem;
  height: 1rem;
}

/* 检查中：图标旋转 */
.sidebar__update-icon--spin {
  animation: sidebar-spin 0.8s linear infinite;
}

/* 旋转动画 */
@keyframes sidebar-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 宽屏：侧栏常驻（sticky 随页面滚动），隐藏关闭按钮 */
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

/* 不支持毛玻璃的浏览器：侧栏回退为纯色 */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .sidebar {
    background: var(--surface);
  }
}
</style>
