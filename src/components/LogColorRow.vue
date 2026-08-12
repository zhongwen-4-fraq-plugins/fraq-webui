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
/* 单行日志配色：标签 + 文字色 + 底色 + 透明度滑杆 */
.log-color {
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* 窄屏自动换行 */
  gap: var(--space-3);
  padding: var(--space-2) 0; /* 上下留出分隔空间 */
}

/* 级别标签（错误/警告/信息/调试） */
.log-color__label {
  width: 2.5rem; /* 固定宽度，各行对齐 */
  flex-shrink: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

/* 文字/底色选择：小标签 + 取色器横排 */
.log-color__field {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--muted);
}

/* 取色器输入框 */
.log-color__input {
  width: 2rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  cursor: pointer;
}

/* 去掉取色器默认内边距，让色块贴边 */
.log-color__input::-webkit-color-swatch-wrapper {
  padding: 0;
  border: none;
}

/* 色块本身无边框无圆角（WebKit） */
.log-color__input::-webkit-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

/* 色块样式（Firefox） */
.log-color__input::-moz-color-swatch {
  border: none;
  border-radius: var(--radius-sm);
}

/* 透明度滑杆：细长圆头轨道 */
.log-color__alpha {
  -webkit-appearance: none; /* 去掉浏览器默认样式 */
  appearance: none;
  width: 6rem;
  height: 0.375rem; /* 轨道高度 */
  border: none;
  border-radius: 999px; /* 圆头轨道 */
  background: var(--app-slider-track-bg, var(--surface-2)); /* 轨道色跟随组件外观 */
  outline: none; /* 去掉默认焦点框，用滑块颜色代替 */
}

/* 滑杆滑块（WebKit）：圆形主色 */
.log-color__alpha::-webkit-slider-thumb {
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
.log-color__alpha::-moz-range-thumb {
  width: 1rem;
  height: 1rem;
  border: none;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

/* 透明度数值：等宽字体，固定宽度 */
.log-color__alpha-value {
  width: 2.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; /* 等宽字体 */
  font-size: var(--text-xs);
  color: var(--muted);
}
</style>
