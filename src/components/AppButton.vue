<script setup>
import { computed } from 'vue'
import { NButton } from 'naive-ui'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger | danger-ghost
  size: { type: String, default: 'md' }, // md | sm | icon
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  href: { type: String, default: '' },
  target: { type: String, default: '' },
})

defineEmits(['click'])

const VARIANT_MAP = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'quaternary',
  danger: 'error',
  'danger-ghost': 'error',
}

const SIZE_MAP = {
  md: 'medium',
  sm: 'small',
  icon: 'medium',
}

const buttonType = computed(() => VARIANT_MAP[props.variant] ?? 'default')
const quaternary = computed(() => props.variant === 'ghost' || props.variant === 'danger-ghost')
const buttonSize = computed(() => SIZE_MAP[props.size] ?? 'medium')
</script>

<template>
  <NButton
    :type="buttonType"
    :quaternary="quaternary"
    :size="buttonSize"
    :loading="loading"
    :disabled="disabled || loading"
    :attr-type="href ? undefined : type"
    :tag="href ? 'a' : 'button'"
    :href="href || undefined"
    :target="target || undefined"
    :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
    :autofocus="autofocus"
    @click="$emit('click', $event)"
  >
    <slot />
  </NButton>
</template>
