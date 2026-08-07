<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
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
      <p class="eyebrow">Private trade intelligence</p>
      <h1>外贸智能跟单中枢</h1>
      <p>面向高价值客户沟通、报价草稿和跟进决策的私密工作台。</p>
    </section>
    <form class="login-panel" @submit.prevent="login">
      <h2>安全登录</h2>
      <el-input v-model="username" size="large" :prefix-icon="User" autocomplete="username" />
      <el-input v-model="password" size="large" :prefix-icon="Lock" type="password" show-password autocomplete="current-password" />
      <el-button native-type="submit" type="primary" size="large" :loading="loading">进入系统</el-button>
    </form>
  </main>
</template>
