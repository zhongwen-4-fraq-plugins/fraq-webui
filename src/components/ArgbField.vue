<script setup>
import { computed } from 'vue'
import { hexToRgb, toHex } from '../data/color.js'

const props = defineProps({
  label: { type: String, required: true },
  model: { type: Object, required: true }, // { color: '#rrggbb', alpha: 0..1 }
})

const hex = computed({
  get: () => props.model.color,
  set: (value) => {
    props.model.color = value
  },
})

const alphaPercent = computed({
  get: () => Math.round(props.model.alpha * 100),
  set: (value) => {
    props.model.alpha = Number(value) / 100
  },
})

const argb = computed(() => {
  const { r, g, b } = hexToRgb(props.model.color)
  const a = toHex(Math.round(props.model.alpha * 255))
  return `#${a}${toHex(r)}${toHex(g)}${toHex(b)}`
})
</script>

<template>
  <div class="argb">
    <span class="argb__label">{{ label }}</span>
    <input v-model="hex" type="color" class="argb__color" :aria-label="`${label}颜色`" />
    <input
      v-model="alphaPercent"
      type="range"
      min="0"
      max="100"
      class="argb__alpha"
      :aria-label="`${label}透明度`"
    />
    <code class="argb__value">{{ argb }}</code>
  </div>
</template>

<style scoped>
.argb {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.argb__label {
  width: 5rem;
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

.argb__color {
  width: 2.5rem;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  cursor: pointer;
}

.argb__alpha {
  flex: 1;
  min-width: 6rem;
  accent-color: var(--primary);
}

.argb__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--muted);
  white-space: nowrap;
}
</style>
