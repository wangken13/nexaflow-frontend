<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowDown, Bell, Box, Collection, DataAnalysis, Document, Finished, Message, Service, Setting, SwitchButton, User } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { tradeApi } from '../api/trade'
import { useAuthStore } from '../stores/auth'
import { labelOf, roleLabels } from '../utils/presentation'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const unreadCount = ref(0)
const isLoggingOut = ref(false)
const todayLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())
const pageContext = computed(() => ({
  '/app': ['经营总览', '今天需要优先处理的客户与订单工作'],
  '/app/customers': ['客户中心', '客户资料、联系人与跟进记录'],
  '/app/products': ['产品目录', '产品规格、价格与可售状态'],
  '/app/inquiries': ['询盘中心', '客户需求识别与响应推进'],
  '/app/quotations': ['报价中心', '报价制作、审批与客户反馈'],
  '/app/orders': ['订单交付', '履约进度与交付风险控制'],
  '/app/tasks': ['跟进任务', '团队待办与提醒安排'],
  '/app/notifications': ['消息中心', '业务提醒与系统通知'],
  '/app/help': ['帮助与支持', '操作指南、服务说明与问题工单'],
  '/app/governance': ['企业治理', '成员、角色与业务审计']
}[route.path] || ['NexaFlow 工作台', '企业业务数据已隔离']))
const nav = [
  { to: '/app', label: '经营总览', icon: DataAnalysis },
  { to: '/app/customers', label: '客户中心', icon: User },
  { to: '/app/products', label: '产品目录', icon: Box },
  { to: '/app/inquiries', label: '询盘中心', icon: Message },
  { to: '/app/quotations', label: '报价中心', icon: Document },
  { to: '/app/orders', label: '订单交付', icon: Collection },
  { to: '/app/tasks', label: '跟进任务', icon: Finished }
]

async function logout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await auth.logout()
  } finally {
    await router.replace('/login')
    isLoggingOut.value = false
  }
}

async function loadSignals() {
  try {
    unreadCount.value = (await tradeApi.notifications()).filter(item => !item.read).length
  } catch {
    unreadCount.value = 0
  }
}

onMounted(loadSignals)
watch(() => route.path, loadSignals)
</script>

<template>
  <div class="app-shell">
    <aside class="side-nav">
      <div class="product-mark"><span>NX</span><div><strong>NexaFlow</strong><small>客户协同</small></div></div>
      <p class="nav-caption">工作流</p>
      <nav>
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="nav-link">
          <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="nav-foot">
        <RouterLink v-if="['OWNER','ADMIN'].includes(auth.role)" to="/app/governance" class="nav-link"><el-icon><Setting /></el-icon><span>企业治理</span></RouterLink>
        <RouterLink to="/app/notifications" class="nav-link"><el-icon><Bell /></el-icon><span>消息中心</span><b v-if="unreadCount">{{ unreadCount > 99 ? '99+' : unreadCount }}</b></RouterLink>
        <RouterLink to="/app/help" class="nav-link"><el-icon><Service /></el-icon><span>帮助与支持</span></RouterLink>
        <button class="nav-link" type="button" @click="logout"><el-icon><SwitchButton /></el-icon><span>安全退出</span></button>
      </div>
    </aside>
    <section class="workspace-stage">
      <header class="workspace-bar">
        <div class="workspace-context"><span class="workspace-pulse"></span><div><strong>{{ pageContext[0] }}</strong><small>{{ pageContext[1] }}</small></div></div>
        <div class="workspace-actions">
          <span class="workspace-date">{{ todayLabel }}</span>
          <RouterLink to="/app/notifications" class="top-notice" aria-label="查看消息中心"><el-icon><Bell /></el-icon><b v-if="unreadCount">{{ unreadCount > 99 ? '99+' : unreadCount }}</b></RouterLink>
          <el-dropdown trigger="click">
            <button class="account-button" type="button"><span>{{ (auth.username || '用').slice(0, 1).toUpperCase() }}</span><div><strong>{{ auth.username || '当前账号' }}</strong><small>{{ labelOf(roleLabels, auth.role, '团队成员') }}</small></div><el-icon><ArrowDown /></el-icon></button>
            <template #dropdown><el-dropdown-menu><el-dropdown-item @click="logout">安全退出</el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
        </div>
      </header>
      <main class="app-main"><RouterView /></main>
    </section>
  </div>
</template>
