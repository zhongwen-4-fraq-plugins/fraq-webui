<script setup>
import { ref } from 'vue'
import { NButton, NCard, NForm, NFormItem, NInput } from 'naive-ui'
import { store } from '../services/store.js'

const token = ref('')
const submitting = ref(false)
const inputRef = ref(null)

async function submit() {
  if (!token.value || submitting.value) return
  submitting.value = true
  try {
    await store.login(token.value)
  } catch {
    // 错误信息已在 store.auth.error 中
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login">
    <NCard class="login__card" :bordered="false" size="large">
      <div class="login__brand" aria-hidden="true">F</div>
      <h1 id="login-title" class="login__title">fraq-webui</h1>
      <p class="login__description">输入登录令牌以管理 fraq 实例。</p>

      <NForm class="login__form" @submit.prevent="submit">
        <NFormItem label="登录令牌" label-placement="top">
          <NInput
            ref="inputRef"
            v-model:value="token"
            type="password"
            show-password-on="click"
            placeholder="输入登录令牌"
            autocomplete="current-password"
            :status="store.state.auth.error ? 'error' : undefined"
            :disabled="submitting"
            @keydown.enter="submit"
          />
        </NFormItem>

        <p v-if="store.state.auth.error" class="login__error" role="alert">
          {{ store.state.auth.error }}
        </p>

        <NButton
          type="primary"
          block
          attr-type="submit"
          :loading="submitting"
          :disabled="!token"
          class="login__submit"
        >
          登录
        </NButton>
      </NForm>

      <p class="login__hint">
        令牌在启动管理服务的终端中显示；设置 FRAQ_WEBUI_TOKEN 环境变量可固定。
      </p>
    </NCard>
  </main>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-4);
}

.login__card {
  width: min(24rem, 100%);
  --n-color: var(--app-component-bg, oklch(1 0 0 / 0.9));
  -webkit-backdrop-filter: blur(var(--app-component-blur, 0px)) saturate(1.4);
  backdrop-filter: blur(var(--app-component-blur, 0px)) saturate(1.4);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.login__brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  font-size: var(--text-lg);
}

.login__title {
  margin-top: var(--space-4);
  font-size: var(--text-xl);
  font-weight: 600;
}

.login__description {
  margin-top: var(--space-1);
  color: var(--muted);
  font-size: var(--text-sm);
}

.login__form {
  margin-top: var(--space-5);
  text-align: left;
}

.login__error {
  margin-top: var(--space-2);
  color: var(--danger);
  font-size: var(--text-xs);
}

.login__submit {
  margin-top: var(--space-4);
}

.login__hint {
  margin-top: var(--space-4);
  color: var(--muted);
  font-size: var(--text-xs);
  line-height: 1.5;
}
</style>
