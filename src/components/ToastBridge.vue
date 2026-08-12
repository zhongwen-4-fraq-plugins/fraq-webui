<script setup>
import { watch } from 'vue'
import { useMessage } from 'naive-ui'
import { store } from '../services/store.js'
import { TOAST_DURATION_MS } from '../core/config.js'

const message = useMessage()

// store 里入队的 toast 交给 Naive UI message 渲染
watch(
  () => store.state.toasts.length,
  () => {
    while (store.state.toasts.length > 0) {
      const item = store.state.toasts.shift()
      const options = { duration: TOAST_DURATION_MS, closable: true }
      if (item.type === 'success') message.success(item.message, options)
      else if (item.type === 'error') message.error(item.message, options)
      else message.info(item.message, options)
    }
  },
)
</script>

<template>
  <div class="toast-bridge" />
</template>
