<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { MagicStick, Plus } from '@element-plus/icons-vue'
import { tradeApi, type CustomerView, type InquiryAnalysis, type InquiryView } from '../api/trade'
import { formatDateTime, humanizeSystemText, inquiryStatusLabels, labelOf, priorityLabels } from '../utils/presentation'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../security/permissions'

const auth = useAuthStore()

const inquiries = ref<InquiryView[]>([])
const customers = ref<CustomerView[]>([])
const selected = ref<InquiryView | null>(null)
const analysis = ref<InquiryAnalysis | null>(null)
const history = ref<InquiryAnalysis[]>([])
const composer = ref(false)
const processing = ref(false)
const form = ref({ customerId: '', subject: '', content: '' })
const statusOptions = Object.entries(inquiryStatusLabels).map(([value, label]) => ({ value, label }))
function customerName(customerId: string) { return customers.value.find(item => item.id === customerId)?.name || '客户资料待同步' }
async function load() { [inquiries.value, customers.value] = await Promise.all([tradeApi.inquiries(), tradeApi.customers()]) }
async function select(item: InquiryView) { selected.value = item; history.value = await tradeApi.analysisHistory(item.id); analysis.value = history.value[0] || null }
async function createAndAnalyze() {
  if (!form.value.customerId || !form.value.subject.trim() || !form.value.content.trim()) return ElMessage.warning('请完整填写客户、主题和询盘内容')
  processing.value = true
  try {
    const inquiry = await tradeApi.createInquiry(form.value)
    analysis.value = await tradeApi.analyzeInquiry(inquiry.id, inquiry.content)
    await Promise.all([
      tradeApi.updateInquiryStatus(inquiry.id, 'ANALYZED'),
      tradeApi.createTask({ title: `跟进：${inquiry.subject}`, priority: analysis.value.urgency, dueAt: new Date(Date.now() + 4 * 3600_000).toISOString(), relatedType: 'INQUIRY', relatedId: inquiry.id })
    ])
    composer.value = false; form.value = { customerId: '', subject: '', content: '' }; await load(); await select(inquiry); ElMessage.success('询盘已分析，并创建跟进任务')
  } finally { processing.value = false }
}
async function changeStatus(status: string) { if (!selected.value) return; selected.value = await tradeApi.updateInquiryStatus(selected.value.id, status); await load(); ElMessage.success('询盘状态已更新') }
onMounted(load)
</script>

<template>
  <section class="page-shell">
    <header class="page-head"><div><p class="section-kicker">需求识别与响应</p><h1>询盘中心</h1><p>保留客户原文，让 AI 围绕真实要求提取信息并生成下一步动作。</p></div><el-button v-if="hasPermission(auth.role, 'inquiry:write')" type="primary" :icon="Plus" @click="composer=true">录入询盘</el-button></header>
    <div class="inquiry-layout">
      <section class="surface inbox-pane"><div class="surface-head"><h2>询盘队列</h2><span>{{ inquiries.length }} 条</span></div><button v-for="item in inquiries" :key="item.id" class="record-button inquiry-record" :class="{ active: selected?.id === item.id }" @click="select(item)"><div><strong>{{ item.subject }}</strong><small>{{ customerName(item.customerId) }}</small></div><span class="state-chip">{{ labelOf(inquiryStatusLabels, item.status) }}</span></button><div v-if="!inquiries.length" class="empty-compact">还没有询盘</div></section>
      <section class="surface inquiry-detail">
        <template v-if="selected">
          <div class="surface-head"><div><h2>{{ selected.subject }}</h2><p>{{ customerName(selected.customerId) }} · {{ formatDateTime(selected.createdAt) }}</p></div><el-select v-if="hasPermission(auth.role, 'inquiry:write')" :model-value="selected.status" style="width:160px" @change="changeStatus"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select><span v-else class="state-chip">{{ labelOf(inquiryStatusLabels, selected.status) }}</span></div>
          <div class="source-message"><label>客户原文</label><p>{{ selected.content }}</p></div>
          <div v-if="analysis" class="analysis-sheet"><div class="analysis-head"><div><span>AI 业务判断</span><h3>{{ humanizeSystemText(analysis.intent) }}</h3></div><span class="state-chip priority">{{ labelOf(priorityLabels, analysis.urgency, '普通') }}</span></div><div class="analysis-grid"><article><label>需求摘要</label><p>{{ humanizeSystemText(analysis.modelSummary) }}</p></article><article><label>建议动作</label><ul><li v-for="item in analysis.nextActions" :key="item">{{ humanizeSystemText(item) }}</li></ul></article></div><article class="draft-block"><label>客户回复草稿</label><p>{{ humanizeSystemText(analysis.replyDraft) }}</p></article><article class="draft-block"><label>报价建议</label><p>{{ humanizeSystemText(analysis.quotationDraft) }}</p></article></div>
          <div v-else class="empty-state">这条询盘还没有 AI 分析记录</div>
        </template>
        <div v-else class="empty-state">选择一条询盘查看客户原文与 AI 建议</div>
      </section>
    </div>
    <el-drawer v-model="composer" title="录入客户询盘" size="520px"><el-form label-position="top"><el-form-item label="客户"><el-select v-model="form.customerId" filterable placeholder="选择客户"><el-option v-for="item in customers" :key="item.id" :label="item.name" :value="item.id"/></el-select></el-form-item><el-form-item label="询盘主题"><el-input v-model="form.subject"/></el-form-item><el-form-item label="客户原文"><el-input v-model="form.content" type="textarea" :rows="14" placeholder="粘贴邮件或聊天原文，保留数量、规格、交期和贸易条款"/></el-form-item><el-button type="primary" :icon="MagicStick" :loading="processing" class="full-button" @click="createAndAnalyze">保存并生成处理方案</el-button></el-form></el-drawer>
  </section>
</template>
