<script setup>
import { onMounted } from 'vue'
import AppShell from './components/AppShell.vue'
import LoginView from './components/LoginView.vue'
import LogColorsDialog from './components/LogColorsDialog.vue'
import ToastHost from './components/ToastHost.vue'
import { store } from './services/store.js'

onMounted(() => store.checkAuth())
</script>

<template>
  <ToastHost />
  <div v-if="store.state.auth.checking" class="auth-splash">正在加载...</div>
  <LoginView v-else-if="!store.state.auth.authenticated" />
  <template v-else>
    <AppShell />
    <LogColorsDialog v-model:open="store.state.logColorsOpen" />
  </template>
</template>

<style scoped>
.auth-splash {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  color: var(--muted);
  font-size: var(--text-sm);
}
</style>
