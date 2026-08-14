<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, CircleCheck, Delete, MagicStick, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tradeApi, type CustomerView, type DailyReport, type InquiryView, type OnboardingView, type OrderView, type QuotationView, type TaskView, type TenantProfileResponse } from '../api/trade'
import { formatDate, formatDateTime, inquiryStatusLabels, labelOf, priorityLabels } from '../utils/presentation'
import { useAuthStore } from '../stores/auth'

type FocusItem = {
  id: string
  title: string
  detail: string
  level: 'risk' | 'urgent' | 'normal'
  route: string
  time: number
}

const tenant = ref<TenantProfileResponse | null>(null)
const report = ref<DailyReport | null>(null)
const customers = ref<CustomerView[]>([])
const inquiries = ref<InquiryView[]>([])
const quotations = ref<QuotationView[]>([])
const orders = ref<OrderView[]>([])
const tasks = ref<TaskView[]>([])
const loading = ref(true)
const onboarding = ref<OnboardingView | null>(null)
const onboardingSaving = ref(false)
const auth = useAuthStore()
const onboardingRoutes: Record<string, string> = { MEMBER: '/app/governance', CUSTOMER: '/app/customers', PRODUCT: '/app/products', MAILBOX: '/app/governance', INQUIRY: '/app/inquiries' }

const pipeline = computed(() => [
  { label: '客户资产', value: customers.value.length, note: '已沉淀客户' },
  { label: '待处理询盘', value: inquiries.value.filter(i => !['CLOSED', 'QUOTED'].includes(i.status)).length, note: '需要推进' },
  { label: '有效报价', value: quotations.value.filter(q => !['REJECTED', 'EXPIRED'].includes(q.status)).length, note: '报价管道' },
  { label: '交付风险', value: orders.value.filter(o => o.risk).length, note: '需要干预' }
])

const focusItems = computed<FocusItem[]>(() => {
  const taskItems = tasks.value
    .filter(task => task.status !== 'DONE')
    .map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      detail: `${labelOf(priorityLabels, task.priority, '普通')} · ${formatDateTime(task.dueAt)}`,
      level: task.priority === 'HIGH' ? 'urgent' as const : 'normal' as const,
      route: '/app/tasks',
      time: new Date(task.dueAt).getTime() || Number.MAX_SAFE_INTEGER
    }))
  const orderItems = orders.value
    .filter(order => order.risk)
    .map(order => ({
      id: `order-${order.id}`,
      title: `${order.customerName} · ${order.productName}`,
      detail: `交付日期 ${formatDate(order.deliveryDate)}`,
      level: 'risk' as const,
      route: '/app/orders',
      time: new Date(order.deliveryDate).getTime() || Number.MAX_SAFE_INTEGER
    }))
  const inquiryItems = inquiries.value
    .filter(inquiry => inquiry.status === 'PENDING_AI')
    .map(inquiry => ({
      id: `inquiry-${inquiry.id}`,
      title: inquiry.subject,
      detail: '等待 AI 分析与首次响应',
      level: 'urgent' as const,
      route: '/app/inquiries',
      time: new Date(inquiry.createdAt).getTime() || Number.MAX_SAFE_INTEGER
    }))
  const rank = { risk: 0, urgent: 1, normal: 2 }
  return [...orderItems, ...taskItems, ...inquiryItems]
    .sort((left, right) => rank[left.level] - rank[right.level] || left.time - right.time)
    .slice(0, 5)
})

const workdaySummary = computed(() => {
  if (!focusItems.value.length) return '当前没有需要优先处理的事项，业务节奏稳定。'
  return `当前有 ${focusItems.value.length} 项事项需要优先处理，建议从交付风险和紧急跟进开始。`
})

function customerName(customerId: string) {
  return customers.value.find(item => item.id === customerId)?.name || '客户资料待同步'
}

async function loadDashboard() {
  loading.value = true
  try {
    [tenant.value, report.value, customers.value, inquiries.value, quotations.value, orders.value, tasks.value, onboarding.value] = await Promise.all([
      tradeApi.tenantProfile(), tradeApi.dailyReport(), tradeApi.customers(), tradeApi.inquiries(),
      tradeApi.quotations(), tradeApi.orders(), tradeApi.tasks(), tradeApi.onboarding().catch(() => null)
    ])
  } finally {
    loading.value = false
  }
}

async function createDemoData() {
  onboardingSaving.value = true
  try { await tradeApi.createDemoData(); await loadDashboard(); ElMessage.success('演示数据已生成，可沿询盘到交付流程体验') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '演示数据生成失败') }
  finally { onboardingSaving.value = false }
}

async function clearDemoData() {
  try { await ElMessageBox.confirm('只会清理系统生成的演示数据，真实业务数据不会受影响。', '清理演示数据', { type: 'warning', confirmButtonText: '确认清理' }) }
  catch { return }
  onboardingSaving.value = true
  try { await tradeApi.clearDemoData(); await loadDashboard(); ElMessage.success('演示数据已清理') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '演示数据清理失败') }
  finally { onboardingSaving.value = false }
}

onMounted(loadDashboard)
</script>

<template>
  <section v-loading="loading" class="page-shell dashboard-page">
    <header class="page-head dashboard-head">
      <div>
        <p class="section-kicker">经营总览</p>
        <h1>{{ tenant?.name || '业务工作台' }}</h1>
        <p>从最需要推进的客户事项开始，逐步完成今天的业务闭环。</p>
      </div>
      <div class="dashboard-head-actions">
        <RouterLink class="quiet-action" to="/app/inquiries">查看询盘<el-icon><ArrowRight /></el-icon></RouterLink>
        <RouterLink class="primary-action" to="/app/tasks">处理待办<el-icon><ArrowRight /></el-icon></RouterLink>
      </div>
    </header>

    <section v-if="onboarding && onboarding.completedSteps < onboarding.totalSteps" class="onboarding-strip">
      <div class="onboarding-summary"><span>企业开通</span><strong>{{ onboarding.completedSteps }} / {{ onboarding.totalSteps }} 已完成</strong><p>完成这些步骤后，团队即可从真实渠道接入客户并推进完整业务流程。</p></div>
      <div class="onboarding-steps">
        <RouterLink v-for="step in onboarding.steps" :key="step.code" :to="onboardingRoutes[step.code] || '/app'" :class="{ done: step.completed }">
          <el-icon><CircleCheck /></el-icon><span><strong>{{ step.title }}</strong><small>{{ step.completed ? '已完成' : step.description }}</small></span><el-icon><ArrowRight /></el-icon>
        </RouterLink>
      </div>
      <div v-if="['OWNER','ADMIN'].includes(auth.role)" class="onboarding-actions">
        <el-button v-if="!onboarding.demoDataPresent" :icon="MagicStick" :loading="onboardingSaving" @click="createDemoData">生成演示数据</el-button>
        <el-button v-else :icon="Delete" :loading="onboardingSaving" @click="clearDemoData">清理演示数据</el-button>
      </div>
    </section>

    <section class="snapshot-bar">
      <div><i></i><strong>今日业务快照</strong><span>客户、询盘、报价和交付数据已汇总</span></div>
      <span>工作时间内更新</span>
    </section>

    <div class="metric-band dashboard-kpis">
      <article v-for="(item, index) in pipeline" :key="item.label" class="metric-cell" :class="{ accent: index === 0 }">
        <span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.note }}</small>
      </article>
    </div>

    <section class="dashboard-command-grid">
      <section class="surface focus-surface">
        <div class="surface-head focus-head">
          <div><span class="surface-eyebrow">行动脊柱</span><h2>优先推进</h2></div>
          <RouterLink to="/app/tasks">全部待办</RouterLink>
        </div>
        <p class="focus-intro">{{ workdaySummary }}</p>
        <div class="focus-list">
          <RouterLink v-for="item in focusItems" :key="item.id" :to="item.route" class="focus-row" :class="item.level">
            <span class="focus-marker"><el-icon><WarningFilled v-if="item.level !== 'normal'" /><CircleCheck v-else /></el-icon></span>
            <span><strong>{{ item.title }}</strong><small>{{ item.detail }}</small></span>
            <el-icon class="focus-arrow"><ArrowRight /></el-icon>
          </RouterLink>
        </div>
        <div v-if="!focusItems.length" class="focus-empty"><el-icon><CircleCheck /></el-icon><span>没有需要优先处理的事项</span></div>
      </section>

      <aside class="surface dashboard-signal-panel">
        <div class="signal-title"><span>业务节奏</span><small>OPERATIONS PULSE</small></div>
        <div class="business-track">
          <div><strong>询盘进入</strong><span>{{ report?.newInquiries ?? 0 }} 条</span></div>
          <div><strong>跟进推进</strong><span>{{ report?.openTasks ?? 0 }} 项</span></div>
          <div><strong>订单交付</strong><span>{{ report?.riskyOrders ?? 0 }} 项风险</span></div>
          <div><strong>报价审批</strong><span>{{ report?.pendingApprovals ?? 0 }} 份待处理</span></div>
          <div><strong>逾期跟进</strong><span>{{ report?.overdueTasks ?? 0 }} 项</span></div>
        </div>
        <p class="report-note">{{ report?.summary || '业务数据汇总中' }}</p>
      </aside>
    </section>

    <section class="surface recent-inquiry-surface">
      <div class="surface-head"><div><span class="surface-eyebrow">客户动态</span><h2>最新进入的询盘</h2></div><RouterLink to="/app/inquiries">进入询盘中心</RouterLink></div>
      <div class="recent-inquiry-grid">
        <RouterLink v-for="item in inquiries.slice(0, 4)" :key="item.id" to="/app/inquiries" class="recent-inquiry">
          <span class="state-chip">{{ labelOf(inquiryStatusLabels, item.status) }}</span>
          <strong>{{ item.subject }}</strong><small>{{ customerName(item.customerId) }}</small><el-icon><ArrowRight /></el-icon>
        </RouterLink>
        <div v-if="!inquiries.length" class="empty-compact">暂无询盘，新的客户需求会显示在这里</div>
      </div>
    </section>
  </section>
</template>
