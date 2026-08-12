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
/* 应用外壳：整页最小高度 */
.shell {
  min-height: 100dvh;
}

/* 右侧主区域：纵向排列（顶栏 + 内容），允许内容收缩 */
.shell__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 内容区：居中限宽，四周留白 */
.shell__content {
  flex: 1;
  width: 100%;
  max-width: 68rem; /* 内容最大宽度，超宽屏不拉满 */
  margin: 0 auto; /* 水平居中 */
  padding: var(--space-5) var(--space-4) var(--space-8); /* 上 左右 下 */
  outline: none; /* 跳转聚焦时不显示外框，避免视觉跳动 */
}

/* 窄屏下侧栏抽屉打开时覆盖全屏的遮罩 */
.shell__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop); /* 位于侧栏之下 */
  background: oklch(0.22 0.015 220 / 0.35); /* 半透明深色遮罩 */
}

/* 宽屏：固定侧栏 + 内容双列布局 */
@media (min-width: 900px) {
  .shell {
    display: grid; /* 侧栏 15rem，其余给内容 */
    grid-template-columns: 15rem 1fr;
  }

  /* 宽屏下内容四周留白更大 */
  .shell__content {
    padding: var(--space-6) var(--space-7) var(--space-8);
  }
}
</style>
