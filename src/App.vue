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
/* 登录状态检查期间的全屏加载提示 */
.auth-splash {
  display: flex; /* 水平垂直居中 */
  align-items: center;
  justify-content: center;
  min-height: 100dvh; /* 铺满整个视口 */
  color: var(--muted); /* 次要文字色 */
  font-size: var(--text-sm);
}
</style>
