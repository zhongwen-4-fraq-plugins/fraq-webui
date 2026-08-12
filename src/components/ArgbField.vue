<script setup>
import { computed } from 'vue'
import { NColorPicker, NSlider } from 'naive-ui'
import { hexToRgb, toHex } from '../data/color.js'

const props = defineProps({
  label: { type: String, required: true },
  model: { type: Object, required: true }, // { color: '#rrggbb', alpha: 0..1, blur: 0..40 }
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
    props.model.alpha = Math.min(100, Math.max(0, Number(value))) / 100
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
    <NColorPicker
      v-model:value="hex"
      :modes="['hex']"
      :show-alpha="false"
      size="small"
      class="argb__color"
      :aria-label="`${label}颜色`"
    />
    <div class="argb__slider">
      <span class="argb__slider-label">透明度</span>
      <NSlider
        v-model:value="alphaPercent"
        :min="0"
        :max="100"
        :tooltip="false"
        class="argb__range"
        :aria-label="`${label}透明度`"
      />
    </div>
    <div class="argb__slider">
      <span class="argb__slider-label">模糊</span>
      <NSlider
        v-model:value="blurValue"
        :min="0"
        :max="40"
        :tooltip="false"
        class="argb__range"
        :aria-label="`${label}模糊程度`"
      />
    </div>
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

.argb__slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.argb__slider-label {
  font-size: var(--text-xs);
  color: var(--muted);
}

.argb__range {
  width: 7rem;
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
