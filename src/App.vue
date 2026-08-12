<script setup>
import { computed, onMounted } from 'vue'
import { NConfigProvider, NSpin, dateZhCN, zhCN } from 'naive-ui'
import AppShell from './components/AppShell.vue'
import LoginView from './components/LoginView.vue'
import LogColorsDialog from './components/LogColorsDialog.vue'
import ToastHost from './components/ToastHost.vue'
import { store } from './services/store.js'
import { buildThemeOverrides } from './core/naiveTheme.js'

const themeOverrides = computed(() => buildThemeOverrides(store.state.appearance))

onMounted(() => store.checkAuth())
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <ToastHost />
    <div v-if="store.state.auth.checking" class="auth-splash">
      <NSpin size="small" />
      <span>正在加载...</span>
    </div>
    <LoginView v-else-if="!store.state.auth.authenticated" />
    <template v-else>
      <AppShell />
      <LogColorsDialog v-model:open="store.state.logColorsOpen" />
    </template>
  </NConfigProvider>
</template>

<style scoped>
.auth-splash {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 100dvh;
  color: var(--muted);
  font-size: var(--text-sm);
}
</style>
