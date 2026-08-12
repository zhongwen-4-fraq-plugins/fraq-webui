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
    <input v-model="hex" type="color" class="argb__color" :aria-label="`${label}颜色`" />
    <div class="argb__slider">
      <span class="argb__slider-label">透明度</span>
      <input
        v-model="alphaPercent"
        type="range"
        min="0"
        max="100"
        class="argb__alpha"
        :aria-label="`${label}透明度`"
      />
    </div>
    <div class="argb__slider">
      <span class="argb__slider-label">模糊</span>
      <input
        v-model="blurValue"
        type="range"
        min="0"
        max="40"
        step="1"
        class="argb__blur"
        :aria-label="`${label}模糊程度`"
      />
    </div>
    <span class="argb__blur-value">{{ blurValue }}px</span>
    <code class="argb__value">{{ argb }}</code>
  </div>
</template>

<style scoped>
/* ARGB 配色行：标签 + 取色器 + 透明度/模糊滑杆 + 结果值 */
.argb {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 窄屏自动换行 */
  gap: var(--space-3);
}

/* 区域标签（顶栏/侧边栏/...） */
.argb__label {
  width: 5rem; /* 固定宽度，各行对齐 */
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

/* 单个滑杆列：标签在上、滑杆在下 */
.argb__slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px; /* 标签与滑杆间距 */
}

/* 滑杆上的小标签 */
.argb__slider-label {
  font-size: var(--text-xs);
  color: var(--muted);
}

/* 取色器 */
.argb__color {
  width: 2.5rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  cursor: pointer;
}

/* 去掉取色器默认内边距，让色块贴边 */
.argb__color::-webkit-color-swatch-wrapper {
  padding: 0;
  border: none;
}

/* 色块本身无边框无圆角（WebKit） */
.argb__color::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

/* 色块样式（Firefox） */
.argb__color::-moz-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

/* 透明度滑杆：细长圆头轨道 */
.argb__alpha {
  -webkit-appearance: none; /* 去掉浏览器默认样式 */
  appearance: none;
  width: 6rem;
  min-width: 6rem; /* 窄屏不缩得太小 */
  height: 0.375rem; /* 轨道高度 */
  border: none;
  border-radius: 999px; /* 圆头轨道 */
  background: var(--app-slider-track-bg, var(--surface-2)); /* 轨道色跟随组件外观 */
  outline: none; /* 去掉默认焦点框 */
}

/* 模糊滑杆：与透明度滑杆同款轨道 */
.argb__blur {
  -webkit-appearance: none;
  appearance: none;
  width: 6rem;
  min-width: 6rem;
  height: 0.375rem;
  border: none;
  border-radius: 999px;
  background: var(--app-slider-track-bg, var(--surface-2));
  outline: none;
}

/* 滑杆滑块（WebKit）：圆形主色 */
.argb__alpha::-webkit-slider-thumb,
.argb__blur::-webkit-slider-thumb {
  -webkit-appearance: none; /* 去掉默认滑块 */
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

/* 滑杆滑块（Firefox） */
.argb__alpha::-moz-range-thumb,
.argb__blur::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

/* 模糊数值 */
.argb__blur-value {
  width: 2.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; /* 等宽字体 */
  font-size: var(--text-xs);
  color: var(--muted);
}

/* ARGB 结果值：等宽字体，不换行 */
.argb__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; /* 等宽字体 */
  font-size: var(--text-xs);
  color: var(--muted);
  white-space: nowrap; /* 保持一行 */
}
</style>
