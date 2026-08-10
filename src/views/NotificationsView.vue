<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, CircleCheck, Search } from '@element-plus/icons-vue'
import { tradeApi, type NotificationView } from '../api/trade'
import { formatDateTime, humanizeSystemText } from '../utils/presentation'

const notifications = ref<NotificationView[]>([])
const keyword = ref('')
const loading = ref(false)
const visible = computed(() => notifications.value.filter(item => `${item.title}${item.content}`.toLowerCase().includes(keyword.value.toLowerCase())))
const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)

async function load() {
  loading.value = true
  try { notifications.value = await tradeApi.notifications() } finally { loading.value = false }
}
async function markRead(item: NotificationView) { if (item.read) return; await tradeApi.markNotificationRead(item.id); item.read = true }
async function markAllRead() { if (!unreadCount.value) return; await tradeApi.markAllNotificationsRead(); await load(); ElMessage.success('消息已全部标记为已读') }
onMounted(load)
</script>

<template>
  <section class="page-shell">
    <header class="page-head"><div><p class="section-kicker">业务提醒与系统消息</p><h1>消息中心</h1><p>集中查看跟进提醒、报价反馈和订单风险通知。</p></div><div class="action-row"><span class="page-count">{{ unreadCount }} 条未读</span><el-button v-if="unreadCount" :icon="CircleCheck" @click="markAllRead">全部已读</el-button></div></header>
    <section v-loading="loading" class="surface notification-surface">
      <div class="table-toolbar"><el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索消息" clearable /></div>
      <article v-for="item in visible" :key="item.id" class="notification-row" :class="{ unread: !item.read }"><span class="notification-icon"><el-icon><Bell /></el-icon></span><div><strong>{{ humanizeSystemText(item.title) }}</strong><p>{{ humanizeSystemText(item.content) }}</p><small>{{ formatDateTime(item.createdAt) }}</small></div><el-button v-if="!item.read" text @click="markRead(item)">标记已读</el-button><span v-else class="state-chip muted">已读</span></article>
      <div v-if="!visible.length" class="empty-state">当前没有业务消息</div>
    </section>
  </section>
</template>
