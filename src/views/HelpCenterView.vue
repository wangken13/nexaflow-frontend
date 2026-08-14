<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatLineRound, CircleCheck, Document, Plus, RefreshRight, Search, Service } from '@element-plus/icons-vue'
import { tradeApi, type SupportTicketView } from '../api/trade'
import { formatDateTime } from '../utils/presentation'

const activeTab = ref('guides')
const tickets = ref<SupportTicketView[]>([])
const selected = ref<SupportTicketView | null>(null)
const loading = ref(false)
const saving = ref(false)
const createDialog = ref(false)
const detailDrawer = ref(false)
const keyword = ref('')
const reply = ref('')
const form = reactive({ category: 'OPERATION', priority: 'NORMAL', subject: '', description: '' })

const guides = [
  { title: '15 分钟完成企业开通', summary: '邀请成员、导入客户与产品、接入邮箱并创建第一条询盘。', steps: ['在企业治理中邀请成员并设置数据范围', '使用标准模板导入客户和产品', '配置企业邮箱并确认连接状态', '从询盘中心完成分析、报价和跟进'] },
  { title: '从询盘推进到订单交付', summary: '让客户信息、报价审批与订单履约保持连续。', steps: ['选择已有客户录入或自动接收询盘', '确认 AI 建议并安排下一步任务', '从产品目录生成报价并按规则审批', '报价确认后创建订单并跟踪交付风险'] },
  { title: '建立可信的企业知识库', summary: '让 AI 根据真实资料工作，并明确标注依据。', steps: ['整理产品规格、价格规则和交付政策', '在企业治理中按分类录入知识', '仅启用已审核且仍然有效的资料', '分析后检查知识来源和资料不足提示'] },
  { title: '权限与数据范围配置', summary: '控制成员能够查看和操作的数据边界。', steps: ['先建立部门，再邀请企业成员', '按岗位分配 OWNER、ADMIN、SALES 等角色', '选择全部、部门或本人数据范围', '使用审计记录定期复核敏感操作'] }
]
const visibleGuides = computed(() => guides.filter(item => `${item.title}${item.summary}${item.steps.join('')}`.includes(keyword.value.trim())))
const statusLabels: Record<string, string> = { OPEN: '待受理', WAITING_SUPPORT: '等待客服', WAITING_CUSTOMER: '等待回复', RESOLVED: '已解决', CLOSED: '已关闭' }
const categoryLabels: Record<string, string> = { OPERATION: '使用咨询', DATA: '数据问题', INTEGRATION: '接口与接入', BILLING: '套餐与账单', INCIDENT: '故障报告' }
const priorityLabels: Record<string, string> = { LOW: '一般', NORMAL: '普通', HIGH: '紧急', CRITICAL: '严重故障' }

async function loadTickets() {
  loading.value = true
  try { tickets.value = await tradeApi.supportTickets() }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '工单加载失败') }
  finally { loading.value = false }
}

async function createTicket() {
  if (form.subject.trim().length < 5) return ElMessage.warning('问题标题至少填写 5 个字')
  if (form.description.trim().length < 10) return ElMessage.warning('请补充问题现象、影响范围和期望结果')
  saving.value = true
  try {
    const ticket = await tradeApi.createSupportTicket({ ...form, subject: form.subject.trim(), description: form.description.trim() })
    createDialog.value = false
    Object.assign(form, { category: 'OPERATION', priority: 'NORMAL', subject: '', description: '' })
    await loadTickets()
    await openTicket(ticket)
    ElMessage.success('工单已提交，处理进度会持续记录在这里')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '工单提交失败') }
  finally { saving.value = false }
}

async function openTicket(ticket: SupportTicketView) {
  loading.value = true
  try { selected.value = await tradeApi.supportTicket(ticket.id); detailDrawer.value = true }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '工单详情加载失败') }
  finally { loading.value = false }
}

async function sendReply() {
  if (!selected.value || reply.value.trim().length < 2) return ElMessage.warning('请输入需要补充的内容')
  saving.value = true
  try {
    await tradeApi.replySupportTicket(selected.value.id, reply.value.trim())
    reply.value = ''
    selected.value = await tradeApi.supportTicket(selected.value.id)
    await loadTickets()
    ElMessage.success('补充内容已提交')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '回复提交失败') }
  finally { saving.value = false }
}

async function closeTicket() {
  if (!selected.value) return
  saving.value = true
  try {
    selected.value = await tradeApi.closeSupportTicket(selected.value.id)
    await loadTickets()
    ElMessage.success('工单已关闭')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '工单关闭失败') }
  finally { saving.value = false }
}

onMounted(loadTickets)
</script>

<template>
  <section class="page-shell help-center">
    <header class="page-head">
      <div><p class="section-kicker">产品交付与客户支持</p><h1>帮助与支持</h1><p>查看操作指南、服务范围和版本信息，遇到问题时直接创建可追踪工单。</p></div>
      <el-button v-if="activeTab === 'tickets'" type="primary" :icon="Plus" @click="createDialog=true">提交工单</el-button>
    </header>

    <section class="surface help-surface">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="操作指南" name="guides">
          <div class="help-toolbar"><el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索操作问题" clearable /></div>
          <div class="guide-list">
            <details v-for="guide in visibleGuides" :key="guide.title">
              <summary><span><el-icon><Document /></el-icon></span><div><strong>{{ guide.title }}</strong><p>{{ guide.summary }}</p></div></summary>
              <ol><li v-for="step in guide.steps" :key="step">{{ step }}</li></ol>
            </details>
            <div v-if="!visibleGuides.length" class="empty-state">没有找到相关指南，请换个关键词或提交工单。</div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的工单" name="tickets">
          <div v-loading="loading" class="ticket-list">
            <button v-for="ticket in tickets" :key="ticket.id" type="button" class="ticket-row" @click="openTicket(ticket)">
              <span class="ticket-icon"><el-icon><ChatLineRound /></el-icon></span>
              <div><strong>{{ ticket.subject }}</strong><p>{{ categoryLabels[ticket.category] || ticket.category }} · {{ priorityLabels[ticket.priority] || ticket.priority }}</p></div>
              <time>{{ formatDateTime(ticket.updatedAt) }}</time>
              <span class="state-chip" :class="ticket.status === 'CLOSED' ? 'muted' : 'active'">{{ statusLabels[ticket.status] || ticket.status }}</span>
            </button>
            <div v-if="!loading && !tickets.length" class="empty-state"><el-icon><Service /></el-icon><strong>当前没有支持工单</strong><span>需要帮助时提交问题，我们会保留完整处理记录。</span></div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="服务说明" name="service">
          <div class="service-commitments">
            <article><span>服务可用性</span><strong>核心业务优先</strong><p>AI、短信或外部渠道异常时，客户、询盘、报价和订单等核心数据仍可继续操作。</p></article>
            <article><span>数据迁移</span><strong>标准模板交付</strong><p>通过标准模板导入客户和产品，并提供逐行失败原因与可下载报告。</p></article>
            <article><span>问题响应</span><strong>按影响等级处理</strong><p>工单记录影响范围、优先级、沟通过程和最终结果，严重故障优先处理。</p></article>
            <article><span>版本更新</span><strong>可追溯变更</strong><p>当前版本持续完善渠道接入、审批、知识库、权限、计费与稳定性治理。</p></article>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="createDialog" title="提交支持工单" width="620px">
      <el-form label-position="top">
        <div class="form-grid"><el-form-item label="问题类型"><el-select v-model="form.category"><el-option v-for="(label,value) in categoryLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item><el-form-item label="影响程度"><el-select v-model="form.priority"><el-option v-for="(label,value) in priorityLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item></div>
        <el-form-item label="问题标题"><el-input v-model="form.subject" maxlength="160" show-word-limit placeholder="简要说明遇到的问题" /></el-form-item>
        <el-form-item label="问题详情"><el-input v-model="form.description" type="textarea" :rows="7" maxlength="3000" show-word-limit placeholder="请说明操作步骤、问题现象、影响范围和期望结果，避免填写密码或密钥" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="createDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="createTicket">提交工单</el-button></template>
    </el-dialog>

    <el-drawer v-model="detailDrawer" title="工单详情" size="min(680px, 94vw)">
      <template v-if="selected">
        <div class="ticket-detail-head"><div><span>{{ categoryLabels[selected.category] || selected.category }}</span><h2>{{ selected.subject }}</h2><p>{{ selected.description }}</p></div><span class="state-chip active">{{ statusLabels[selected.status] || selected.status }}</span></div>
        <div class="ticket-meta"><span>优先级<strong>{{ priorityLabels[selected.priority] || selected.priority }}</strong></span><span>创建时间<strong>{{ formatDateTime(selected.createdAt) }}</strong></span><span>最近更新<strong>{{ formatDateTime(selected.updatedAt) }}</strong></span></div>
        <div class="ticket-conversation">
          <article v-for="message in selected.messages" :key="message.id"><span>{{ message.authorId.slice(0, 1).toUpperCase() }}</span><div><strong>{{ message.authorId === selected.createdBy ? '企业成员' : '支持人员' }}</strong><p>{{ message.content }}</p><time>{{ formatDateTime(message.createdAt) }}</time></div></article>
          <div v-if="!selected.messages.length" class="empty-state">暂无补充记录</div>
        </div>
        <div v-if="selected.status !== 'CLOSED'" class="ticket-reply"><el-input v-model="reply" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="补充问题信息或回复支持人员" /><div><el-button :icon="CircleCheck" @click="closeTicket">问题已解决</el-button><el-button type="primary" :icon="RefreshRight" :loading="saving" @click="sendReply">提交回复</el-button></div></div>
      </template>
    </el-drawer>
  </section>
</template>
