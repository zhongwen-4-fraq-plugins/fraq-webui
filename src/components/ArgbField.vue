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

const blurValue = computed({
  get: () => props.model.blur,
  set: (value) => {
    props.model.blur = Number(value)
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
    <input
      v-model="blurValue"
      type="range"
      min="0"
      max="40"
      step="1"
      class="argb__blur"
      :aria-label="`${label}模糊程度`"
    />
    <span class="argb__blur-value">{{ blurValue }}px</span>
    <code class="argb__value">{{ argb }}</code>
  </div>
</template>

<style scoped>
.argb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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
  border: none;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  cursor: pointer;
}

.argb__color::-webkit-color-swatch-wrapper {
  padding: 0;
  border: none;
}

.argb__color::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.argb__color::-moz-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.argb__alpha {
  -webkit-appearance: none;
  appearance: none;
  width: 6rem;
  min-width: 6rem;
  height: 0.375rem;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-component-bg, var(--surface-2)) 60%, transparent);
  outline: none;
}

.argb__blur {
  -webkit-appearance: none;
  appearance: none;
  width: 6rem;
  min-width: 6rem;
  height: 0.375rem;
  border: none;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-component-bg, var(--surface-2)) 60%, transparent);
  outline: none;
}

.argb__alpha::-webkit-slider-thumb,
.argb__blur::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.argb__alpha::-moz-range-thumb,
.argb__blur::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.argb__blur-value {
  width: 2.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--muted);
}

.argb__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--muted);
  white-space: nowrap;
}
</style>
