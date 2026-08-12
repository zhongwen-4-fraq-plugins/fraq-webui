<script setup>
import { computed, h, ref } from 'vue'
import { NButton, NIcon, NMenu } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import {
  Apps,
  LayoutGrid,
  ListDetails,
  Loader,
  Refresh,
  Settings,
  Tool,
  X,
} from '@vicons/tabler'
import { APP_NAME, APP_VERSION } from '../core/config.js'
import { httpApi } from '../services/httpApi.js'
import { store } from '../services/store.js'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const checking = ref(false)

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const navItems = [
  { to: '/', label: '概览', icon: LayoutGrid },
  { to: '/plugins', label: '插件', icon: Apps },
  { to: '/install', label: '安装', icon: Tool },
  { to: '/logs', label: '日志', icon: ListDetails },
  { to: '/settings', label: '设置', icon: Settings },
]

const menuOptions = navItems.map((item) => ({
  key: item.to,
  label: item.label,
  icon: renderIcon(item.icon),
}))

const activeKey = computed(() => route.path)

function onMenuSelect(key) {
  if (key !== route.path) router.push(key)
  emit('close')
}

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
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': open }" aria-label="主导航">
    <div class="sidebar__brand">
      <span class="sidebar__logo" aria-hidden="true">F</span>
      <span class="sidebar__name">{{ APP_NAME }}</span>
      <NButton
        quaternary
        circle
        size="small"
        class="sidebar__close"
        aria-label="关闭导航"
        @click="emit('close')"
      >
        <template #icon>
          <NIcon><X /></NIcon>
        </template>
      </NButton>
    </div>

    <nav class="sidebar__nav">
      <NMenu
        :value="activeKey"
        :options="menuOptions"
        :root-indent="0"
        @update:value="onMenuSelect"
      />
    </nav>

    <div class="sidebar__footer">
      <span class="sidebar__version">fraq-webui v{{ APP_VERSION }}</span>
      <NButton
        quaternary
        circle
        size="small"
        class="sidebar__update"
        :disabled="checking"
        :aria-label="checking ? '正在检查更新' : '检查更新'"
        @click="checkUpdate"
      >
        <template #icon>
          <NIcon><Refresh v-if="!checking" /><Loader v-else class="sidebar__update-icon--spin" /></NIcon>
        </template>
      </NButton>
    </div>
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
  margin-left: auto;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
}

.sidebar__nav :deep(.n-menu) {
  background: transparent;
}

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

.sidebar__version {
  white-space: nowrap;
}

.sidebar__update-icon--spin {
  animation: sidebar-spin 0.8s linear infinite;
}

@keyframes sidebar-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 900px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    transform: none;
    transition: none;
    flex-shrink: 0;
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
