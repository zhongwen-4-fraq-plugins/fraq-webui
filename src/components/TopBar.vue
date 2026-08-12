<script setup>
import { computed, ref } from 'vue'
import { NButton, NIcon, NTag } from 'naive-ui'
import { Logout, Menu2, Power, Square } from '@vicons/tabler'
import { useRoute } from 'vue-router'
import { store } from '../services/store.js'
import { CORE_STATUS } from '../models/coreStatus.js'
import AppButton from './AppButton.vue'
import ConfirmDialog from './ConfirmDialog.vue'

defineEmits(['toggle-nav'])

const route = useRoute()
const dialogOpen = ref(false)

const connectionBadge = computed(() => {
  const core = store.state.core
  if (core.status !== CORE_STATUS.running) {
    return { tone: 'neutral', label: '未运行' }
  }
  return core.connected
    ? { tone: 'success', label: '已连接' }
    : { tone: 'warning', label: '连接断开' }
})

const coreRunning = computed(() => store.state.core.status === CORE_STATUS.running)
const pageTitle = computed(() => route.meta.title ?? '')
</script>

<template>
  <header class="topbar">
    <div class="topbar__inner">
      <NButton
        quaternary
        circle
        class="topbar__menu"
        aria-label="打开导航"
        @click="$emit('toggle-nav')"
      >
        <template #icon>
          <NIcon><Menu2 /></NIcon>
        </template>
      </NButton>
      <h1 class="topbar__title">{{ pageTitle }}</h1>

      <div class="topbar__right">
        <NTag :type="connectionBadge.tone === 'success' ? 'success' : connectionBadge.tone === 'warning' ? 'warning' : 'default'" size="small" :bordered="false">
          {{ connectionBadge.label }}
        </NTag>
        <AppButton
          :variant="coreRunning ? 'secondary' : 'primary'"
          size="sm"
          :loading="store.state.busyCore"
          @click="dialogOpen = true"
        >
          <NIcon v-if="coreRunning"><Square /></NIcon>
          <NIcon v-else><Power /></NIcon>
          {{ coreRunning ? '停止核心' : '启动核心' }}
        </AppButton>
        <NButton
          quaternary
          circle
          class="topbar__logout"
          aria-label="退出登录"
          title="退出登录"
          @click="store.logout()"
        >
          <template #icon>
            <NIcon><Logout /></NIcon>
          </template>
        </NButton>
      </div>
    </div>

    <ConfirmDialog
      v-model:open="dialogOpen"
      :title="coreRunning ? '停止 fraq 核心？' : '启动 fraq 核心？'"
      :confirm-label="coreRunning ? '停止核心' : '启动核心'"
      :danger="coreRunning"
      :loading="store.state.busyCore"
      @confirm="coreRunning ? store.stopCore() : store.startCore(); dialogOpen = false"
    >
      <template v-if="coreRunning">
        正在处理的消息会中断，未保存的插件状态可能丢失。停止后日志会记录本次操作。
      </template>
      <template v-else>
        核心启动后会自动连接 Milky 协议端，并加载已启用的插件。
      </template>
    </ConfirmDialog>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--app-topbar-bg, oklch(1 0 0 / 0.72));
  -webkit-backdrop-filter: blur(var(--app-topbar-blur, 16px)) saturate(1.5);
  backdrop-filter: blur(var(--app-topbar-blur, 16px)) saturate(1.5);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .topbar {
    background: var(--bg);
  }
}

.topbar__inner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 68rem;
  height: 3.5rem;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.topbar__menu {
  display: none;
}

.topbar__title {
  font-size: var(--text-base);
  font-weight: 600;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-left: auto;
}

@media (min-width: 900px) {
  .topbar__inner {
    padding: 0 var(--space-7);
  }
}

@media (max-width: 899px) {
  .topbar__menu {
    display: inline-flex;
  }
}
</style>
