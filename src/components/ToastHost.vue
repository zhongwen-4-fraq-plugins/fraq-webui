<script setup>
import { NMessageProvider } from 'naive-ui'
import ToastBridge from './ToastBridge.vue'
</script>

<template>
  <NMessageProvider :max="5" placement="top-right">
    <ToastBridge />
  </NMessageProvider>
</template>
