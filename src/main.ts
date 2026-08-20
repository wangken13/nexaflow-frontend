import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus, { ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './styles.css'
import './enterprise.css'
import './operations.css'
import './public-site.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.config.errorHandler = (error) => {
  if (error === 'cancel' || error === 'close') return
  const message = error instanceof Error ? error.message : '操作失败，请稍后重试'
  ElMessage.error(message)
}

app.use(createPinia()).use(router).use(ElementPlus, { locale: zhCn }).mount('#app')
