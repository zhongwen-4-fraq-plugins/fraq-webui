<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  model: { type: Object, required: true }, // { color, bgColor, bgAlpha }
})

const bgAlphaPercent = computed({
  get: () => Math.round(props.model.bgAlpha * 100),
  set: (value) => {
    props.model.bgAlpha = Number(value) / 100
  },
})
</script>

<template>
  <div class="log-color">
    <span class="log-color__label">{{ label }}</span>
    <label class="log-color__field">
      文字
      <input v-model="model.color" type="color" class="log-color__input" :aria-label="`${label}文字颜色`" />
    </label>
    <label class="log-color__field">
      底色
      <input v-model="model.bgColor" type="color" class="log-color__input" :aria-label="`${label}底色`" />
    </label>
    <input
      v-model="bgAlphaPercent"
      type="range"
      min="0"
      max="100"
      class="log-color__alpha"
      :aria-label="`${label}底色透明度`"
    />
    <span class="log-color__alpha-value">{{ bgAlphaPercent }}%</span>
  </div>
</template>

<style scoped>
.log-color {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.log-color__label {
  width: 2.5rem;
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

.log-color__field {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--muted);
}

.log-color__input {
  width: 2rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  cursor: pointer;
}

.log-color__input::-webkit-color-swatch-wrapper {
  padding: 0;
  border: none;
}

.log-color__input::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.log-color__input::-moz-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

.log-color__alpha {
  -webkit-appearance: none;
  appearance: none;
  width: 6rem;
  height: 0.375rem;
  border: none;
  border-radius: 999px;
  background:
    color-mix(in srgb, var(--app-component-bg, var(--surface-2)) 60%, transparent),
    color-mix(in srgb, var(--surface-2) 20%, transparent);
  outline: none;
}

.log-color__alpha::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.log-color__alpha::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.log-color__alpha-value {
  width: 2.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--muted);
}
</style>
