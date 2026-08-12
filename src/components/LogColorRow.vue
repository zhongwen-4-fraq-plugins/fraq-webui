<script setup>
import { computed } from 'vue'
import { NColorPicker, NSlider } from 'naive-ui'

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
      <NColorPicker
        v-model:value="model.color"
        :modes="['hex']"
        :show-alpha="false"
        size="small"
        :aria-label="`${label}文字颜色`"
      />
    </label>
    <label class="log-color__field">
      底色
      <NColorPicker
        v-model:value="model.bgColor"
        :modes="['hex']"
        :show-alpha="false"
        size="small"
        :aria-label="`${label}底色`"
      />
    </label>
    <div class="log-color__slider">
      <NSlider
        v-model:value="bgAlphaPercent"
        :min="0"
        :max="100"
        :tooltip="false"
        class="log-color__range"
        :aria-label="`${label}底色透明度`"
      />
      <span class="log-color__alpha-value">{{ bgAlphaPercent }}%</span>
    </div>
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

.log-color__slider {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.log-color__range {
  width: 7rem;
}

.log-color__alpha-value {
  width: 2.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--text-xs);
  color: var(--muted);
}
</style>
