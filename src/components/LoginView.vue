<script setup>
import { ref } from 'vue'
import IconEye from '~icons/tabler/eye'
import IconEyeOff from '~icons/tabler/eye-off'
import IconLock from '~icons/tabler/lock'
import { store } from '../services/store.js'
import AppButton from './AppButton.vue'

const token = ref('')
const showToken = ref(false)
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
    <section class="login__card" aria-labelledby="login-title">
      <div class="login__brand" aria-hidden="true">F</div>
      <h1 id="login-title" class="login__title">fraq-webui</h1>
      <p class="login__description">输入登录令牌以管理 fraq 实例。</p>

      <form class="login__form" @submit.prevent="submit">
        <label class="login__label" for="login-token">登录令牌</label>
        <div class="login__input-wrap">
          <IconLock class="login__input-icon" aria-hidden="true" />
          <input
            id="login-token"
            ref="inputRef"
            v-model="token"
            class="login__input"
            :type="showToken ? 'text' : 'password'"
            placeholder="输入登录令牌"
            autocomplete="current-password"
            :aria-invalid="Boolean(store.state.auth.error)"
            :disabled="submitting"
            @keydown.enter="submit"
          />
          <button
            type="button"
            class="login__toggle"
            :aria-label="showToken ? '隐藏令牌' : '显示令牌'"
            @click="showToken = !showToken"
          >
            <IconEyeOff v-if="showToken" aria-hidden="true" />
            <IconEye v-else aria-hidden="true" />
          </button>
        </div>

        <p v-if="store.state.auth.error" class="login__error" role="alert">
          {{ store.state.auth.error }}
        </p>

        <AppButton class="login__submit" type="submit" :loading="submitting" :disabled="!token">
          登录
        </AppButton>
      </form>

      <p class="login__hint">
        令牌在启动管理服务的终端中显示；设置 FRAQ_WEBUI_TOKEN 环境变量可固定。
      </p>
    </section>
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
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--app-component-bg, oklch(1 0 0 / 0.9));
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

.login__label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
}

.login__input-wrap {
  position: relative;
}

.login__input {
  width: 100%;
  height: 2.5rem;
  padding: 0 2.75rem 0 2.25rem;
  border: 1px solid var(--ink);
  border-radius: var(--radius-md);
  background: var(--app-component-bg, var(--surface-2));
  color: var(--app-text-color, var(--ink));
  font-size: var(--text-sm);
}

.login__input:focus {
  border-color: var(--success);
  outline: none;
}

.login__input[aria-invalid='true'] {
  background: var(--danger-soft);
}

.login__input-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--muted);
  pointer-events: none;
}

.login__toggle {
  position: absolute;
  top: 50%;
  right: var(--space-2);
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.login__toggle:hover {
  background: var(--surface-2);
  color: var(--app-text-color, var(--ink));
}

.login__toggle svg {
  width: 1.125rem;
  height: 1.125rem;
}

.login__error {
  margin-top: var(--space-2);
  color: var(--danger);
  font-size: var(--text-xs);
}

.login__submit {
  width: 100%;
  margin-top: var(--space-4);
}

.login__hint {
  margin-top: var(--space-4);
  color: var(--muted);
  font-size: var(--text-xs);
  line-height: 1.5;
}
</style>
