import { createApp } from 'vue'
import App from './App.vue'
import { router } from './core/router.js'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).use(router).mount('#app')
