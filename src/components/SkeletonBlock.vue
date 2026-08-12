<script setup>
import { NSkeleton } from 'naive-ui'

defineProps({
  lines: { type: Number, default: 1 },
})
</script>

<template>
  <NSkeleton text :repeat="lines" />
</template>
