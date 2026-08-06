<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const username = ref('admin')
const password = ref('admin123')
const loading = ref(false)

async function login() {
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    await router.push('/')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-shell">
    <section class="login-copy">
      <p class="eyebrow">Trade operations cockpit</p>
      <h1>把询盘、报价和跟进放进同一条工作流。</h1>
      <p>为外贸小团队准备的 AI 跟单工作台，先处理最容易漏掉的钱：询盘回复、报价确认、订单风险和到期提醒。</p>
    </section>
    <form class="login-panel" @submit.prevent="login">
      <h2>登录工作台</h2>
      <el-input v-model="username" size="large" :prefix-icon="User" autocomplete="username" />
      <el-input v-model="password" size="large" :prefix-icon="Lock" type="password" show-password autocomplete="current-password" />
      <el-button native-type="submit" type="primary" size="large" :loading="loading">进入系统</el-button>
      <span class="hint">演示账号 admin / admin123</span>
    </form>
  </main>
</template>
