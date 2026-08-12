<script setup>
import { ref } from 'vue'
import SidebarNav from './SidebarNav.vue'
import TopBar from './TopBar.vue'

const navOpen = ref(false)
</script>

<template>
  <div class="shell">
    <a class="skip-link" href="#main">跳到主要内容</a>

    <div v-if="navOpen" class="shell__overlay" @click="navOpen = false" />

    <SidebarNav :open="navOpen" @close="navOpen = false" />

    <div class="shell__main">
      <TopBar @toggle-nav="navOpen = !navOpen" />
      <main id="main" class="shell__content" tabindex="-1">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
}

.shell__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.shell__content {
  flex: 1;
  width: 100%;
  max-width: 68rem;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-8);
  outline: none;
}

.shell__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  background: oklch(0.22 0.015 220 / 0.35);
}

@media (min-width: 900px) {
  .shell {
    display: grid;
    grid-template-columns: 15rem 1fr;
  }

  .shell__content {
    padding: var(--space-6) var(--space-7) var(--space-8);
  }
}
</style>
