<script setup>
import { computed } from 'vue'
import { NTag } from 'naive-ui'

const props = defineProps({
  tone: { type: String, default: 'neutral' }, // success | warning | danger | info | neutral
  dot: { type: Boolean, default: true },
})

const TYPE_MAP = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'default',
}

const tagType = computed(() => TYPE_MAP[props.tone] ?? 'default')
</script>

<template>
  <NTag :type="tagType" size="small" :dot="dot" :bordered="false">
    <slot />
  </NTag>
</template>
