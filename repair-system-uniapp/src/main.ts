import { createSSRApp } from 'vue'
import i18n from './locale'
import App from './App.vue'
import * as Pinia from 'pinia'
import { createUnistorage } from './utils/piniaPlugin'

export function createApp() {
  const app = createSSRApp(App)

  // 从本地存储读取语言设置
  const savedLang = uni.getStorageSync('language') || 'zh'
  i18n.global.locale.value = savedLang

  app.use(i18n);

  // 注册Pinia + 持久化存储
  const store = Pinia.createPinia()
  store.use(createUnistorage())
  app.use(store)

  app.config.errorHandler = (err, vm, info) => {
    console.error('全局错误:', err, info)
  }

  return { app, Pinia }
}