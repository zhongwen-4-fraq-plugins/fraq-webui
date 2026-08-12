<script setup>
defineProps({
  lines: { type: Number, default: 1 },
})
</script>

<template>
  <div class="skeleton" aria-hidden="true">
    <div v-for="index in lines" :key="index" class="skeleton__line" :style="{ width: `${100 - index * 12}%` }" />
  </div>
</template>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton__line {
  height: 0.875rem;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}
</style>
