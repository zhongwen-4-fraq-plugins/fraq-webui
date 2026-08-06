import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
  plugins: [vue(), Icons({ compiler: 'vue3' })],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
})
