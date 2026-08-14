<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { CopyDocument, Delete, Edit, Key, Plus, Refresh, Search, Setting } from '@element-plus/icons-vue'
import { tradeApi, type AiProviderStatus, type ApprovalRuleView, type AuditLogView, type ChannelConfigView, type ChannelCredentialView, type DepartmentView, type EmailMailboxView, type ImportJobView, type IntegrationInvocationView, type InvoiceRequestView, type KnowledgeArticleView, type MemberView, type PlanView, type RefundRequestView, type SubscriptionOrderView, type SubscriptionView } from '../api/trade'
import { useAuthStore } from '../stores/auth'
import { formatDateTime, humanizeSystemText, roleLabels } from '../utils/presentation'
import { workEmailValidationMessage } from '../utils/validation'

const auth = useAuthStore()
const members = ref<MemberView[]>([])
const departments = ref<DepartmentView[]>([])
const audits = ref<AuditLogView[]>([])
const importJobs = ref<ImportJobView[]>([])
const aiProvider = ref<AiProviderStatus>()
const aiStatusLoading = ref(false)
const aiStatusError = ref('')
const knowledge = ref<KnowledgeArticleView[]>([])
const channels = ref<ChannelConfigView[]>([])
const channelCredentials = ref<ChannelCredentialView[]>([])
const emailMailboxes = ref<EmailMailboxView[]>([])
const integrationInvocations = ref<IntegrationInvocationView[]>([])
const subscription = ref<SubscriptionView>()
const billingPlans = ref<PlanView[]>([])
const billingOrders = ref<SubscriptionOrderView[]>([])
const invoiceRequests = ref<InvoiceRequestView[]>([])
const refundRequests = ref<RefundRequestView[]>([])
const approvalRules = ref<ApprovalRuleView[]>([])
const knowledgeDialog = ref(false)
const channelDialog = ref(false)
const credentialDialog = ref(false)
const credentialResultDialog = ref(false)
const mailboxDialog = ref(false)
const approvalRuleDialog = ref(false)
const editingKnowledgeId = ref('')
const editingApprovalRuleId = ref('')
const knowledgeForm = ref({ title: '', category: 'PRODUCT', content: '', active: true })
const channelForm = ref({ channelType: 'EMAIL', displayName: '', accountRef: '', enabled: false })
const credentialForm = ref({ channelType: 'WEBSITE', displayName: '' })
const createdCredential = ref<ChannelCredentialView>()
const mailboxProvider = ref('TENCENT_ENTERPRISE')
const mailboxForm = ref({ displayName: '', emailAddress: '', host: 'imap.exmail.qq.com', port: 993, username: '', password: '', folder: 'INBOX' })
const approvalRuleForm = ref({ name: '', ruleType: 'AMOUNT_THRESHOLD', thresholdAmount: 10000 as number | null, conditionValue: '', enabled: true })
const activeTab = ref('members')
const memberDialog = ref(false)
const departmentDialog = ref(false)
const accessDialog = ref(false)
const billingDialog = ref(false)
const invoiceDialog = ref(false)
const refundDialog = ref(false)
const saving = ref(false)
const auditKeyword = ref('')
const auditModule = ref('')
const form = ref({ username: '', password: '', displayName: '', email: '', role: 'SALES' })
const departmentForm = ref({ name: '', parentId: '' })
const accessMember = ref<MemberView>()
const accessForm = ref({ departmentId: '', dataScope: 'SELF' })
const billingForm = ref({ planCode: 'PRO', billingMonths: 12 })
const billingTargetOrder = ref<SubscriptionOrderView>()
const invoiceForm = ref({ invoiceTitle: '', taxNumber: '', recipientEmail: '' })
const refundReason = ref('')
const memberFormRef = ref<FormInstance>()
function validateWorkEmail(_rule: unknown, value: string | undefined, callback: (error?: Error) => void) {
  const message = workEmailValidationMessage(value)
  callback(message ? new Error(message) : undefined)
}
const memberFormRules: FormRules = {
  displayName: [{ required: true, message: '请输入成员姓名', trigger: 'blur' }],
  username: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { min: 4, max: 64, message: '登录账号长度为 4 至 64 位', trigger: 'blur' }
  ],
  email: [{ validator: validateWorkEmail, trigger: ['blur', 'change'] }],
  password: [{ required: true, min: 8, message: '初始密码至少 8 位', trigger: 'blur' }]
}
const actionLabels: Record<string, string> = {
  MEMBER_CREATED: '新增成员', MEMBER_ROLE_CHANGED: '调整角色', MEMBER_STATUS_CHANGED: '变更账号状态',
  MEMBER_ACCESS_CHANGED: '调整数据范围', DEPARTMENT_CREATED: '新增部门', DEPARTMENT_STATUS_CHANGED: '变更部门状态'
}
const dataScopeLabels: Record<string, string> = { ALL: '全部客户', DEPARTMENT: '本部门客户', SELF: '本人客户' }
const activeMembers = computed(() => members.value.filter(item => item.status === 'ACTIVE').length)
const privilegedMembers = computed(() => members.value.filter(item => ['OWNER', 'ADMIN'].includes(item.role)).length)
const canManageAi = computed(() => ['OWNER', 'ADMIN'].includes(auth.role))
const canManageSettings = computed(() => ['OWNER', 'ADMIN'].includes(auth.role))
const categoryLabels: Record<string, string> = { PRODUCT: '产品资料', PRICING: '价格规则', DELIVERY: '交付说明', POLICY: '企业政策', FAQ: '常见问题' }
const channelLabels: Record<string, string> = { EMAIL: '企业邮箱', WEBSITE: '网站表单', WHATSAPP: 'WhatsApp', WECHAT_WORK: '企业微信' }
const mailboxProviders: Record<string, { label: string; host: string; port: number }> = {
  TENCENT_ENTERPRISE: { label: '腾讯企业邮箱', host: 'imap.exmail.qq.com', port: 993 },
  ALIYUN_ENTERPRISE: { label: '阿里企业邮箱', host: 'imap.qiye.aliyun.com', port: 993 },
  QQ: { label: 'QQ 邮箱', host: 'imap.qq.com', port: 993 },
  NETEASE: { label: '网易 163 邮箱', host: 'imap.163.com', port: 993 },
  CUSTOM: { label: '其他 IMAP 邮箱', host: '', port: 993 }
}
const approvalRuleLabels: Record<string, string> = { AMOUNT_THRESHOLD: '报价金额达到阈值', VIP_CUSTOMER: '指定客户标签', TRADE_TERM: '指定贸易条款' }

async function loadMembers() { [members.value, departments.value] = await Promise.all([tradeApi.members(), tradeApi.departments()]) }
async function loadAudits() { audits.value = await tradeApi.auditLogs(auditModule.value, auditKeyword.value) }
async function loadAiProviderStatus() {
  if (!canManageAi.value) return
  aiStatusLoading.value = true
  aiStatusError.value = ''
  try {
    aiProvider.value = await tradeApi.aiProviderStatus()
  } catch (error) {
    aiStatusError.value = error instanceof Error ? error.message : 'AI 服务状态读取失败'
  } finally {
    aiStatusLoading.value = false
  }
}
async function loadCommercialSettings() {
  knowledge.value = await tradeApi.knowledgeArticles()
  if (canManageSettings.value) {
    const [channelList, usage, rules, credentials, mailboxes, imports, plans, orders, invoices, refunds, invocations] = await Promise.all([
      tradeApi.channels(), tradeApi.subscription(), tradeApi.approvalRules(), tradeApi.channelCredentials(),
      tradeApi.emailMailboxes(), tradeApi.importJobs(), tradeApi.billingPlans(), tradeApi.billingOrders(),
      tradeApi.invoiceRequests(), tradeApi.refundRequests(), tradeApi.integrationInvocations()
    ])
    channels.value = channelList; subscription.value = usage; approvalRules.value = rules
    channelCredentials.value = credentials; emailMailboxes.value = mailboxes; importJobs.value = imports
    billingPlans.value = plans; billingOrders.value = orders; invoiceRequests.value = invoices; refundRequests.value = refunds
    integrationInvocations.value = invocations
  }
}
function openKnowledge(item?: KnowledgeArticleView) {
  editingKnowledgeId.value = item?.id || ''
  knowledgeForm.value = item ? { title: item.title, category: item.category, content: item.content, active: item.active } : { title: '', category: 'PRODUCT', content: '', active: true }
  knowledgeDialog.value = true
}
async function saveKnowledge() {
  if (!knowledgeForm.value.title.trim() || !knowledgeForm.value.content.trim()) return ElMessage.warning('请填写知识标题和内容')
  saving.value = true
  try {
    editingKnowledgeId.value ? await tradeApi.updateKnowledgeArticle(editingKnowledgeId.value, knowledgeForm.value) : await tradeApi.createKnowledgeArticle(knowledgeForm.value)
    knowledgeDialog.value = false; await loadCommercialSettings(); ElMessage.success('知识库已更新，后续 AI 分析会自动引用')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '知识保存失败') }
  finally { saving.value = false }
}
async function removeKnowledge(item: KnowledgeArticleView) {
  try { await tradeApi.deleteKnowledgeArticle(item.id); await loadCommercialSettings(); ElMessage.success('知识条目已删除') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '知识删除失败') }
}
function openChannel(item?: ChannelConfigView) {
  channelForm.value = item ? { channelType: item.channelType, displayName: item.displayName, accountRef: item.accountRef || '', enabled: item.enabled } : { channelType: 'EMAIL', displayName: '', accountRef: '', enabled: false }
  channelDialog.value = true
}
async function saveChannel() {
  if (!channelForm.value.displayName.trim()) return ElMessage.warning('请填写渠道名称')
  saving.value = true
  try { await tradeApi.saveChannel(channelForm.value); channelDialog.value = false; await loadCommercialSettings(); ElMessage.success('渠道配置已保存') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '渠道配置保存失败') }
  finally { saving.value = false }
}
async function createChannelCredential() {
  if (!credentialForm.value.displayName.trim()) return ElMessage.warning('请填写接入名称')
  saving.value = true
  try {
    createdCredential.value = await tradeApi.createChannelCredential(credentialForm.value)
    credentialDialog.value = false
    credentialResultDialog.value = true
    credentialForm.value = { channelType: 'WEBSITE', displayName: '' }
    await loadCommercialSettings()
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '接入凭据创建失败') }
  finally { saving.value = false }
}
async function revokeChannelCredential(item: ChannelCredentialView) {
  try { await tradeApi.revokeChannelCredential(item.id); await loadCommercialSettings(); ElMessage.success('接入凭据已停用') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '接入凭据停用失败') }
}
async function copyCredential(value: string) {
  try { await navigator.clipboard.writeText(value); ElMessage.success('已复制') }
  catch { ElMessage.warning('浏览器未授予复制权限，请手动选择内容') }
}
function selectMailboxProvider(value: string) {
  const provider = mailboxProviders[value]
  mailboxForm.value.host = provider.host
  mailboxForm.value.port = provider.port
}
async function createEmailMailbox() {
  const value = mailboxForm.value
  if (!value.displayName.trim() || !value.emailAddress.trim() || !value.host.trim() || !value.username.trim() || !value.password) return ElMessage.warning('请完整填写邮箱连接信息')
  saving.value = true
  try {
    await tradeApi.createEmailMailbox(value)
    mailboxDialog.value = false
    mailboxForm.value = { displayName: '', emailAddress: '', host: 'imap.exmail.qq.com', port: 993, username: '', password: '', folder: 'INBOX' }
    mailboxProvider.value = 'TENCENT_ENTERPRISE'
    await loadCommercialSettings()
    ElMessage.success('企业邮箱已接入，系统将在一分钟内开始同步未读邮件')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '企业邮箱接入失败') }
  finally { saving.value = false }
}
async function disableEmailMailbox(item: EmailMailboxView) {
  try { await tradeApi.disableEmailMailbox(item.id); await loadCommercialSettings(); ElMessage.success('邮箱自动收取已停用') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '邮箱停用失败') }
}
function openApprovalRule(item?: ApprovalRuleView) {
  editingApprovalRuleId.value = item?.id || ''
  approvalRuleForm.value = item
    ? { name: item.name, ruleType: item.ruleType, thresholdAmount: item.thresholdAmount, conditionValue: item.conditionValue || '', enabled: item.enabled }
    : { name: '', ruleType: 'AMOUNT_THRESHOLD', thresholdAmount: 10000, conditionValue: '', enabled: true }
  approvalRuleDialog.value = true
}
async function saveApprovalRule() {
  if (!approvalRuleForm.value.name.trim()) return ElMessage.warning('请填写审批规则名称')
  if (approvalRuleForm.value.ruleType === 'AMOUNT_THRESHOLD' && (!approvalRuleForm.value.thresholdAmount || approvalRuleForm.value.thresholdAmount <= 0)) return ElMessage.warning('金额阈值必须大于 0')
  if (approvalRuleForm.value.ruleType !== 'AMOUNT_THRESHOLD' && !approvalRuleForm.value.conditionValue.trim()) return ElMessage.warning('请填写规则匹配条件')
  saving.value = true
  try {
    editingApprovalRuleId.value
      ? await tradeApi.updateApprovalRule(editingApprovalRuleId.value, approvalRuleForm.value)
      : await tradeApi.createApprovalRule(approvalRuleForm.value)
    approvalRuleDialog.value = false
    await loadCommercialSettings()
    ElMessage.success('审批规则已保存，新报价将自动执行规则')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '审批规则保存失败') }
  finally { saving.value = false }
}
async function removeApprovalRule(item: ApprovalRuleView) {
  try { await tradeApi.deleteApprovalRule(item.id); await loadCommercialSettings(); ElMessage.success('审批规则已删除') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '审批规则删除失败') }
}
function usagePercent(used: number, limit: number) { return limit ? Math.min(100, Math.round(used / limit * 100)) : 0 }
async function createMember() {
  const valid = await memberFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await tradeApi.createMember(form.value)
    memberDialog.value = false
    form.value = { username: '', password: '', displayName: '', email: '', role: 'SALES' }
    await Promise.all([loadMembers(), loadAudits()])
    ElMessage.success('成员已加入团队')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '新增成员失败')
  } finally { saving.value = false }
}
async function updateRole(member: MemberView, role: string) {
  try { await tradeApi.updateMemberRole(member.id, role); await Promise.all([loadMembers(), loadAudits()]); ElMessage.success('角色已更新') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '角色更新失败') }
}
async function toggleStatus(member: MemberView) {
  const status = member.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  try { await tradeApi.updateMemberStatus(member.id, status); await Promise.all([loadMembers(), loadAudits()]); ElMessage.success(status === 'ACTIVE' ? '账号已启用' : '账号已停用') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '状态更新失败') }
}
function openMemberAccess(member: MemberView) {
  accessMember.value = member
  accessForm.value = { departmentId: member.departmentId || '', dataScope: member.dataScope || 'SELF' }
  accessDialog.value = true
}
async function saveMemberAccess() {
  if (!accessMember.value) return
  if (accessForm.value.dataScope === 'DEPARTMENT' && !accessForm.value.departmentId) return ElMessage.warning('请选择成员所属部门')
  saving.value = true
  try {
    await tradeApi.updateMemberAccess(accessMember.value.id, accessForm.value)
    accessDialog.value = false
    await Promise.all([loadMembers(), loadAudits()])
    ElMessage.success('成员数据范围已更新')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '数据范围更新失败') }
  finally { saving.value = false }
}
async function createDepartment() {
  if (!departmentForm.value.name.trim()) return ElMessage.warning('请输入部门名称')
  saving.value = true
  try {
    await tradeApi.createDepartment(departmentForm.value)
    departmentDialog.value = false
    departmentForm.value = { name: '', parentId: '' }
    await Promise.all([loadMembers(), loadAudits()])
    ElMessage.success('部门已创建')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '部门创建失败') }
  finally { saving.value = false }
}
async function createBillingOrder() {
  saving.value = true
  try {
    const order = await tradeApi.createBillingOrder(billingForm.value)
    billingDialog.value = false
    await loadCommercialSettings()
    if (order.checkoutUrl) window.open(order.checkoutUrl, '_blank', 'noopener,noreferrer')
    else ElMessage.warning('订阅订单已保存，但收银台尚未配置，请联系平台商务人员完成付款')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '订阅订单创建失败') }
  finally { saving.value = false }
}
function openCheckout(url: string) { window.open(url, '_blank', 'noopener,noreferrer') }
function openInvoice(order: SubscriptionOrderView) { billingTargetOrder.value = order; invoiceForm.value = { invoiceTitle: '', taxNumber: '', recipientEmail: '' }; invoiceDialog.value = true }
async function submitInvoice() {
  if (!billingTargetOrder.value || !invoiceForm.value.invoiceTitle.trim() || !invoiceForm.value.recipientEmail.trim()) return ElMessage.warning('请填写发票抬头和接收邮箱')
  saving.value = true
  try { await tradeApi.createInvoiceRequest(billingTargetOrder.value.id, invoiceForm.value); invoiceDialog.value = false; await loadCommercialSettings(); ElMessage.success('发票申请已提交') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '发票申请提交失败') }
  finally { saving.value = false }
}
function openRefund(order: SubscriptionOrderView) { billingTargetOrder.value = order; refundReason.value = ''; refundDialog.value = true }
async function submitRefund() {
  if (!billingTargetOrder.value || !refundReason.value.trim()) return ElMessage.warning('请填写退款原因')
  saving.value = true
  try { await tradeApi.createRefundRequest(billingTargetOrder.value.id, refundReason.value); refundDialog.value = false; await loadCommercialSettings(); ElMessage.success('退款申请已提交') }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '退款申请提交失败') }
  finally { saving.value = false }
}
onMounted(async () => {
  await Promise.all([loadMembers(), loadAudits(), loadAiProviderStatus(), loadCommercialSettings()])
})
</script>

<template>
  <section class="page-shell governance-page">
    <header class="page-head"><div><p class="section-kicker">组织、知识与商业配置</p><h1>企业治理</h1><p>管理团队访问边界、企业知识、业务渠道和套餐用量。</p></div><el-button v-if="activeTab === 'members'" type="primary" :icon="Plus" @click="memberDialog = true">新增成员</el-button><el-button v-else-if="activeTab === 'knowledge'" type="primary" :icon="Plus" @click="openKnowledge()">新增知识</el-button><el-button v-else-if="activeTab === 'approvals'" type="primary" :icon="Plus" @click="openApprovalRule()">新增审批规则</el-button><el-button v-else-if="activeTab === 'channels'" type="primary" :icon="Plus" @click="openChannel()">配置渠道</el-button></header>
    <section class="governance-summary">
      <div><span>团队成员</span><strong>{{ members.length }}</strong></div>
      <div><span>正常账号</span><strong>{{ activeMembers }}</strong></div>
      <div><span>管理账号</span><strong>{{ privilegedMembers }}</strong></div>
      <div><span>审计事件</span><strong>{{ audits.length }}</strong></div>
    </section>
    <section class="surface governance-surface">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="团队成员" name="members">
          <div class="table-toolbar governance-member-toolbar"><div><strong>组织与数据边界</strong><small>按负责人或部门控制客户可见范围</small></div><el-button :icon="Plus" @click="departmentDialog = true">新增部门</el-button></div>
          <el-table :data="members" row-key="id">
            <el-table-column label="成员" min-width="210"><template #default="{ row }"><div class="member-cell"><span>{{ row.displayName.slice(0, 1) }}</span><div><strong>{{ row.displayName }}</strong><small>{{ row.username }}<template v-if="row.email"> · {{ row.email }}</template></small></div></div></template></el-table-column>
            <el-table-column label="角色" width="190"><template #default="{ row }"><el-select :model-value="row.role" :disabled="auth.role !== 'OWNER' || row.username === 'admin'" @change="updateRole(row, String($event))"><el-option v-for="(label, value) in roleLabels" :key="value" :label="label" :value="value"/></el-select></template></el-table-column>
            <el-table-column label="所属部门" min-width="150"><template #default="{ row }">{{ row.departmentName || '未分配部门' }}</template></el-table-column>
            <el-table-column label="客户数据范围" width="140"><template #default="{ row }"><span class="state-chip">{{ dataScopeLabels[row.dataScope] || '待配置' }}</span></template></el-table-column>
            <el-table-column label="状态" width="110"><template #default="{ row }"><span class="state-chip" :class="{ muted: row.status !== 'ACTIVE' }">{{ row.status === 'ACTIVE' ? '正常' : '已停用' }}</span></template></el-table-column>
            <el-table-column label="加入时间" width="180"><template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template></el-table-column>
            <el-table-column label="操作" width="150" align="right"><template #default="{ row }"><el-button :icon="Setting" text circle title="设置数据范围" @click="openMemberAccess(row)"/><el-button v-if="row.username !== 'admin'" text @click="toggleStatus(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="审计日志" name="audits">
          <div class="table-toolbar"><el-input v-model="auditKeyword" :prefix-icon="Search" placeholder="搜索操作人或详情" clearable @keyup.enter="loadAudits"/><el-select v-model="auditModule" placeholder="全部模块" clearable @change="loadAudits"><el-option label="企业治理" value="TENANT"/></el-select><el-button @click="loadAudits">查询</el-button></div>
          <el-table :data="audits" row-key="id">
            <el-table-column label="时间" width="185"><template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template></el-table-column>
            <el-table-column prop="actor" label="操作账号" width="150"/>
            <el-table-column label="操作" width="140"><template #default="{ row }"><span class="audit-action">{{ actionLabels[row.action] || '其他管理操作' }}</span></template></el-table-column>
            <el-table-column label="变更详情" min-width="260"><template #default="{ row }">{{ humanizeSystemText(row.detail) }}</template></el-table-column>
          </el-table>
          <div v-if="!audits.length" class="empty-compact">暂无符合条件的审计记录</div>
        </el-tab-pane>
        <el-tab-pane v-if="canManageSettings" label="数据导入" name="imports">
          <div class="knowledge-intro"><div><span>迁移可追溯</span><h2>导入任务记录</h2><p>客户和产品批量导入均保留执行人、成功数量和完整失败原因。</p></div><strong>{{ importJobs.length }} 次任务</strong></div>
          <el-table :data="importJobs" row-key="id"><el-table-column label="数据类型" width="130"><template #default="{ row }">{{ row.resourceType === 'CUSTOMER' ? '客户资料' : row.resourceType === 'PRODUCT' ? '产品资料' : row.resourceType }}</template></el-table-column><el-table-column label="结果" min-width="240"><template #default="{ row }"><strong>成功 {{ row.imported }} / {{ row.received }}</strong><small v-if="row.skipped">，{{ row.skipped }} 条需修正</small></template></el-table-column><el-table-column label="状态" width="150"><template #default="{ row }"><span class="state-chip" :class="{ muted: row.skipped }">{{ row.skipped ? '完成但有错误' : '全部成功' }}</span></template></el-table-column><el-table-column prop="operatorId" label="执行人" width="150"/><el-table-column label="执行时间" width="190"><template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template></el-table-column><el-table-column label="错误摘要" min-width="280"><template #default="{ row }"><span class="knowledge-excerpt">{{ row.errors.join('；') || '无错误' }}</span></template></el-table-column></el-table>
          <div v-if="!importJobs.length" class="empty-compact">尚未执行批量数据导入</div>
        </el-tab-pane>
        <el-tab-pane label="企业知识库" name="knowledge">
          <div class="knowledge-intro"><div><span>AI 可信依据</span><h2>企业知识库</h2><p>启用的内容会自动进入询盘分析上下文，模型不得补充知识库之外的企业承诺。</p></div><strong>{{ knowledge.filter(item => item.active).length }} 条启用</strong></div>
          <el-table :data="knowledge" row-key="id">
            <el-table-column label="知识条目" min-width="260"><template #default="{ row }"><div class="knowledge-title"><strong>{{ row.title }}</strong><small>{{ categoryLabels[row.category] || row.category }} · {{ formatDateTime(row.updatedAt) }}</small></div></template></el-table-column>
            <el-table-column label="内容摘要" min-width="320"><template #default="{ row }"><span class="knowledge-excerpt">{{ row.content }}</span></template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><span class="state-chip" :class="{ muted: !row.active }">{{ row.active ? '已启用' : '已停用' }}</span></template></el-table-column>
            <el-table-column v-if="canManageSettings" label="操作" width="110" align="right"><template #default="{ row }"><el-button :icon="Edit" text circle title="编辑知识" @click="openKnowledge(row)"/><el-button :icon="Delete" text circle title="删除知识" @click="removeKnowledge(row)"/></template></el-table-column>
          </el-table><div v-if="!knowledge.length" class="empty-compact">还没有企业知识，AI 只能依据客户原文进行判断</div>
        </el-tab-pane>
        <el-tab-pane v-if="canManageSettings" label="审批规则" name="approvals">
          <div class="knowledge-intro"><div><span>自动风险控制</span><h2>报价审批规则</h2><p>新报价命中启用规则后会自动进入主管审批，并保留触发原因。</p></div><strong>{{ approvalRules.filter(item => item.enabled).length }} 条启用</strong></div>
          <el-table :data="approvalRules" row-key="id">
            <el-table-column label="规则" min-width="230"><template #default="{ row }"><div class="knowledge-title"><strong>{{ row.name }}</strong><small>{{ approvalRuleLabels[row.ruleType] || row.ruleType }}</small></div></template></el-table-column>
            <el-table-column label="触发条件" min-width="260"><template #default="{ row }"><span v-if="row.ruleType === 'AMOUNT_THRESHOLD'">报价总额达到 {{ row.thresholdAmount }}</span><span v-else>{{ row.conditionValue }}</span></template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><span class="state-chip" :class="{ muted: !row.enabled }">{{ row.enabled ? '已启用' : '已停用' }}</span></template></el-table-column>
            <el-table-column label="操作" width="110" align="right"><template #default="{ row }"><el-button :icon="Edit" text circle title="编辑规则" @click="openApprovalRule(row)"/><el-button :icon="Delete" text circle title="删除规则" @click="removeApprovalRule(row)"/></template></el-table-column>
          </el-table><div v-if="!approvalRules.length" class="empty-compact">尚未配置审批规则，普通报价可直接发送</div>
        </el-tab-pane>
        <el-tab-pane v-if="canManageSettings" label="渠道接入" name="channels">
          <div class="channel-grid"><article v-for="item in channels" :key="item.id" class="channel-item"><div><span>{{ channelLabels[item.channelType] || item.channelType }}</span><strong>{{ item.displayName }}</strong><small>{{ item.accountRef || '尚未填写业务账号' }}</small></div><div><span class="state-chip" :class="{ muted: !item.enabled }">{{ item.enabled ? '已启用' : '未启用' }}</span><el-button :icon="Edit" text circle title="编辑渠道" @click="openChannel(item)"/></div></article><div v-if="!channels.length" class="empty-compact">尚未配置客户消息渠道</div></div>
          <div class="knowledge-intro channel-credential-head"><div><span>自动收件</span><h2>企业邮箱</h2><p>系统定时读取未读邮件，按发件人自动匹配客户并创建询盘，成功处理后才标记已读。</p></div><el-button @click="mailboxDialog=true">接入企业邮箱</el-button></div>
          <el-table :data="emailMailboxes" row-key="id">
            <el-table-column label="邮箱" min-width="230"><template #default="{ row }"><div class="knowledge-title"><strong>{{ row.displayName }}</strong><small>{{ row.emailAddress }}</small></div></template></el-table-column>
            <el-table-column label="IMAP 服务" min-width="220"><template #default="{ row }">{{ row.host }}:{{ row.port }} / {{ row.folder }}</template></el-table-column>
            <el-table-column label="最近同步" width="180"><template #default="{ row }">{{ row.lastSyncAt ? formatDateTime(row.lastSyncAt) : '等待首次同步' }}</template></el-table-column>
            <el-table-column label="连接状态" width="130"><template #default="{ row }"><span class="state-chip" :class="{ muted: row.connectionStatus !== 'CONNECTED' }">{{ row.connectionStatus === 'CONNECTED' ? '连接正常' : row.connectionStatus === 'ERROR' ? '连接异常' : '等待检测' }}</span></template></el-table-column>
            <el-table-column label="诊断" min-width="190"><template #default="{ row }">{{ row.lastError || '暂无异常' }}</template></el-table-column>
            <el-table-column label="操作" width="90" align="right"><template #default="{ row }"><el-button v-if="row.active" :icon="Delete" text circle title="停用邮箱" @click="disableEmailMailbox(row)"/></template></el-table-column>
          </el-table><div v-if="!emailMailboxes.length" class="empty-compact">尚未接入企业邮箱，当前询盘仍需人工录入或通过 Webhook 推送</div>
          <div class="knowledge-intro channel-credential-head"><div><span>安全接入</span><h2>Webhook 接入凭据</h2><p>网站表单、邮箱解析器或第三方渠道可通过签名请求自动创建客户和询盘。</p></div><el-button :icon="Key" @click="credentialDialog=true">生成接入凭据</el-button></div>
          <el-table :data="channelCredentials" row-key="id">
            <el-table-column label="接入名称" min-width="210"><template #default="{ row }"><div class="knowledge-title"><strong>{{ row.displayName }}</strong><small>{{ channelLabels[row.channelType] || row.channelType }}</small></div></template></el-table-column>
            <el-table-column label="接入地址" min-width="300"><template #default="{ row }"><code>{{ row.endpointPath }}</code></template></el-table-column>
            <el-table-column label="最近调用" width="180"><template #default="{ row }">{{ row.lastUsedAt ? formatDateTime(row.lastUsedAt) : '尚未调用' }}</template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><span class="state-chip" :class="{ muted: !row.active }">{{ row.active ? '有效' : '已停用' }}</span></template></el-table-column>
            <el-table-column label="操作" width="90" align="right"><template #default="{ row }"><el-button v-if="row.active" :icon="Delete" text circle title="停用凭据" @click="revokeChannelCredential(row)"/></template></el-table-column>
          </el-table><div v-if="!channelCredentials.length" class="empty-compact">暂无接入凭据，生成后即可对接网站表单或消息适配器</div>
          <div class="knowledge-intro channel-credential-head"><div><span>调用可追溯</span><h2>最近接口调用</h2><p>保留请求编号、来源、耗时与结果，不记录签名密钥和完整客户正文。</p></div><a class="quiet-action" href="/openapi.yaml" target="_blank" rel="noopener">查看 OpenAPI 文档</a></div>
          <el-table :data="integrationInvocations" row-key="id">
            <el-table-column label="调用时间" width="180"><template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template></el-table-column>
            <el-table-column label="请求编号" min-width="220"><template #default="{ row }"><code>{{ row.requestId }}</code></template></el-table-column>
            <el-table-column prop="clientIp" label="来源地址" width="150"/>
            <el-table-column label="结果" width="120"><template #default="{ row }"><span class="state-chip" :class="{ muted: row.outcome === 'REJECTED' }">{{ row.outcome === 'ACCEPTED' ? '已接收' : row.outcome === 'DUPLICATE' ? '重复请求' : '已拒绝' }}</span></template></el-table-column>
            <el-table-column label="处理耗时" width="120"><template #default="{ row }">{{ row.durationMs }} ms</template></el-table-column>
          </el-table><div v-if="!integrationInvocations.length" class="empty-compact">尚无外部接口调用记录</div>
        </el-tab-pane>
        <el-tab-pane v-if="canManageSettings" label="套餐与用量" name="subscription">
          <div v-if="subscription" class="subscription-layout"><div class="plan-summary"><span>当前套餐</span><h2>{{ subscription.planName }}</h2><p>¥ {{ subscription.monthlyPrice }} / 月</p><strong>{{ subscription.planCode }}</strong><el-button type="primary" @click="billingDialog=true">升级或续费</el-button></div><div class="usage-list"><div><p><span>团队成员</span><strong>{{ subscription.membersUsed }} / {{ subscription.memberLimit }}</strong></p><el-progress :percentage="usagePercent(subscription.membersUsed, subscription.memberLimit)" :show-text="false"/></div><div><p><span>客户档案</span><strong>{{ subscription.customersUsed }} / {{ subscription.customerLimit }}</strong></p><el-progress :percentage="usagePercent(subscription.customersUsed, subscription.customerLimit)" :show-text="false"/></div><div><p><span>AI 分析额度</span><strong>{{ subscription.aiCreditsUsed }} / {{ subscription.aiCreditLimit }}</strong></p><el-progress :percentage="usagePercent(subscription.aiCreditsUsed, subscription.aiCreditLimit)" :show-text="false"/></div></div></div>
          <div class="knowledge-intro billing-section-head"><div><span>采购记录</span><h2>订阅订单</h2><p>支付结果由外部收银台签名回调确认，前端不能修改付款状态。</p></div><strong>{{ billingOrders.length }} 笔订单</strong></div>
          <el-table :data="billingOrders" row-key="id"><el-table-column label="订单" min-width="220"><template #default="{ row }"><div class="knowledge-title"><strong>{{ row.planName }} · {{ row.billingMonths }} 个月</strong><small>{{ row.id }} · {{ formatDateTime(row.createdAt) }}</small></div></template></el-table-column><el-table-column label="金额" width="130"><template #default="{ row }">¥ {{ Number(row.amount).toFixed(2) }}</template></el-table-column><el-table-column label="状态" width="170"><template #default="{ row }"><span class="state-chip" :class="{ muted: row.status !== 'PAID' }">{{ row.status === 'PAID' ? '已支付' : row.status === 'PENDING_PAYMENT' ? '等待支付' : '待配置收银台' }}</span></template></el-table-column><el-table-column label="操作" width="190" align="right"><template #default="{ row }"><el-button v-if="row.checkoutUrl && row.status === 'PENDING_PAYMENT'" text @click="openCheckout(row.checkoutUrl)">继续支付</el-button><el-button v-if="row.status === 'PAID'" text @click="openInvoice(row)">申请发票</el-button><el-button v-if="row.status === 'PAID' && auth.role === 'OWNER'" text @click="openRefund(row)">申请退款</el-button></template></el-table-column></el-table>
          <div class="billing-request-grid"><div><strong>发票申请</strong><span>{{ invoiceRequests.length }} 条</span><small>{{ invoiceRequests[0]?.status === 'SUBMITTED' ? '最近申请正在处理' : '暂无待处理申请' }}</small></div><div><strong>退款申请</strong><span>{{ refundRequests.length }} 条</span><small>{{ refundRequests[0]?.status === 'SUBMITTED' ? '最近申请正在审核' : '暂无待处理申请' }}</small></div></div>
        </el-tab-pane>
        <el-tab-pane v-if="canManageAi" label="AI 服务" name="ai">
          <div class="ai-provider-head">
            <div><span>智能分析引擎</span><h2>模型运行状态</h2></div>
            <el-button :icon="Refresh" :loading="aiStatusLoading" @click="loadAiProviderStatus">刷新状态</el-button>
          </div>
          <div v-if="aiStatusError" class="ai-provider-message error">{{ aiStatusError }}</div>
          <div v-else-if="aiProvider" v-loading="aiStatusLoading" class="ai-provider-grid">
            <div><span>模型供应商</span><strong>{{ aiProvider.provider }}</strong></div>
            <div><span>当前模型</span><strong>{{ aiProvider.model }}</strong></div>
            <div><span>模型配置</span><strong :class="aiProvider.configured ? 'status-ok' : 'status-warn'">{{ aiProvider.configured ? '已配置' : '未配置' }}</strong></div>
            <div><span>本地降级</span><strong>{{ aiProvider.fallbackEnabled ? '已启用' : '未启用' }}</strong></div>
          </div>
          <div v-if="aiProvider" class="ai-provider-message" :class="{ warning: !aiProvider.configured }">
            {{ aiProvider.configured ? '智能询盘分析已完成模型接入配置。' : '当前使用本地规则分析，请配置 DeepSeek API Key 后重启 AI 服务。' }}
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
    <el-dialog v-model="memberDialog" title="新增团队成员" width="540px">
      <el-form ref="memberFormRef" :model="form" :rules="memberFormRules" label-position="top"><div class="form-grid"><el-form-item label="成员姓名" prop="displayName"><el-input v-model="form.displayName" maxlength="128"/></el-form-item><el-form-item label="登录账号" prop="username"><el-input v-model="form.username" maxlength="64"/></el-form-item><el-form-item label="工作邮箱" prop="email"><el-input v-model="form.email" maxlength="255" placeholder="name@company.com"/></el-form-item><el-form-item label="初始密码" prop="password"><el-input v-model="form.password" type="password" show-password maxlength="72"/></el-form-item></div><el-form-item label="成员角色" prop="role"><el-select v-model="form.role"><el-option v-for="(label, value) in roleLabels" :key="value" :label="label" :value="value"/></el-select></el-form-item></el-form>
      <template #footer><el-button @click="memberDialog = false">取消</el-button><el-button type="primary" :loading="saving" @click="createMember">确认新增</el-button></template>
    </el-dialog>
    <el-dialog v-model="departmentDialog" title="新增部门" width="520px"><el-form label-position="top"><el-form-item label="部门名称"><el-input v-model="departmentForm.name" maxlength="128" placeholder="例如：华东销售部"/></el-form-item><el-form-item label="上级部门"><el-select v-model="departmentForm.parentId" clearable placeholder="无上级部门"><el-option v-for="item in departments.filter(value => value.status === 'ACTIVE')" :key="item.id" :label="item.name" :value="item.id"/></el-select></el-form-item></el-form><template #footer><el-button @click="departmentDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="createDepartment">创建部门</el-button></template></el-dialog>
    <el-dialog v-model="accessDialog" title="设置客户数据范围" width="540px"><el-form label-position="top"><el-form-item label="成员"><el-input :model-value="accessMember?.displayName" disabled/></el-form-item><el-form-item label="所属部门"><el-select v-model="accessForm.departmentId" clearable placeholder="请选择所属部门"><el-option v-for="item in departments.filter(value => value.status === 'ACTIVE')" :key="item.id" :label="item.name" :value="item.id"/></el-select></el-form-item><el-form-item label="客户数据范围"><el-radio-group v-model="accessForm.dataScope"><el-radio-button value="SELF">本人客户</el-radio-button><el-radio-button value="DEPARTMENT">本部门客户</el-radio-button><el-radio-button v-if="auth.role === 'OWNER'" value="ALL">全部客户</el-radio-button></el-radio-group></el-form-item><el-alert title="该设置由后端强制执行，直接调用接口也无法越权查看其他客户。" type="info" :closable="false"/></el-form><template #footer><el-button @click="accessDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveMemberAccess">保存范围</el-button></template></el-dialog>
    <el-dialog v-model="billingDialog" title="升级或续费" width="560px"><el-form label-position="top"><el-form-item label="选择套餐"><el-select v-model="billingForm.planCode"><el-option v-for="item in billingPlans" :key="item.planCode" :label="`${item.planName} · ¥${item.monthlyPrice}/月`" :value="item.planCode"/></el-select></el-form-item><el-form-item label="购买周期"><el-input-number v-model="billingForm.billingMonths" :min="1" :max="36"/><span class="billing-total">应付 ¥ {{ Number((billingPlans.find(item => item.planCode === billingForm.planCode)?.monthlyPrice || 0) * billingForm.billingMonths).toFixed(2) }}</span></el-form-item><el-alert title="付款状态只接受支付平台签名回调，避免伪造支付结果。" type="info" :closable="false"/></el-form><template #footer><el-button @click="billingDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="createBillingOrder">创建订阅订单</el-button></template></el-dialog>
    <el-dialog v-model="invoiceDialog" title="申请发票" width="540px"><el-form label-position="top"><el-form-item label="发票抬头"><el-input v-model="invoiceForm.invoiceTitle" maxlength="255"/></el-form-item><el-form-item label="纳税人识别号"><el-input v-model="invoiceForm.taxNumber" maxlength="64"/></el-form-item><el-form-item label="电子发票接收邮箱"><el-input v-model="invoiceForm.recipientEmail" maxlength="255"/></el-form-item></el-form><template #footer><el-button @click="invoiceDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitInvoice">提交申请</el-button></template></el-dialog>
    <el-dialog v-model="refundDialog" title="申请退款" width="540px"><el-alert title="退款申请提交后由平台财务审核，套餐权益不会立即中断。" type="warning" :closable="false"/><el-form label-position="top"><el-form-item label="退款原因"><el-input v-model="refundReason" type="textarea" :rows="5" maxlength="1000" show-word-limit/></el-form-item></el-form><template #footer><el-button @click="refundDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitRefund">提交退款申请</el-button></template></el-dialog>
    <el-dialog v-model="knowledgeDialog" :title="editingKnowledgeId ? '编辑知识' : '新增知识'" width="660px"><el-form label-position="top"><div class="form-grid"><el-form-item label="知识标题"><el-input v-model="knowledgeForm.title" maxlength="200"/></el-form-item><el-form-item label="知识分类"><el-select v-model="knowledgeForm.category"><el-option v-for="(label, value) in categoryLabels" :key="value" :label="label" :value="value"/></el-select></el-form-item></div><el-form-item label="业务内容"><el-input v-model="knowledgeForm.content" type="textarea" :rows="10" maxlength="20000" show-word-limit placeholder="填写真实产品参数、价格规则、交期或企业政策"/></el-form-item><el-switch v-model="knowledgeForm.active" active-text="允许 AI 引用"/></el-form><template #footer><el-button @click="knowledgeDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveKnowledge">保存知识</el-button></template></el-dialog>
    <el-dialog v-model="channelDialog" title="配置客户渠道" width="560px"><el-form label-position="top"><el-form-item label="渠道类型"><el-select v-model="channelForm.channelType"><el-option v-for="(label, value) in channelLabels" :key="value" :label="label" :value="value"/></el-select></el-form-item><el-form-item label="显示名称"><el-input v-model="channelForm.displayName" maxlength="100" placeholder="例如：销售公共邮箱"/></el-form-item><el-form-item label="业务账号标识"><el-input v-model="channelForm.accountRef" maxlength="255" placeholder="邮箱地址、站点名称或企业账号，不要填写密码"/></el-form-item><el-alert title="访问密钥和邮箱密码必须通过服务器环境变量配置，系统不会在这里保存明文密钥。" type="info" :closable="false"/><el-switch v-model="channelForm.enabled" active-text="启用渠道"/></el-form><template #footer><el-button @click="channelDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveChannel">保存配置</el-button></template></el-dialog>
    <el-dialog v-model="mailboxDialog" title="接入企业邮箱" width="620px"><el-form label-position="top"><div class="form-grid"><el-form-item label="邮箱服务商"><el-select v-model="mailboxProvider" @change="selectMailboxProvider(String($event))"><el-option v-for="(item, value) in mailboxProviders" :key="value" :label="item.label" :value="value"/></el-select></el-form-item><el-form-item label="显示名称"><el-input v-model="mailboxForm.displayName" maxlength="128" placeholder="例如：销售公共邮箱"/></el-form-item><el-form-item label="邮箱地址"><el-input v-model="mailboxForm.emailAddress" maxlength="255" placeholder="sales@company.com"/></el-form-item><el-form-item label="登录账号"><el-input v-model="mailboxForm.username" maxlength="255" placeholder="通常与邮箱地址相同"/></el-form-item><el-form-item label="IMAP 服务器"><el-input v-model="mailboxForm.host" maxlength="255"/></el-form-item><el-form-item label="SSL 端口"><el-input-number v-model="mailboxForm.port" :min="1" :max="65535" controls-position="right"/></el-form-item></div><el-form-item label="应用专用密码或授权码"><el-input v-model="mailboxForm.password" type="password" show-password maxlength="512" autocomplete="new-password"/></el-form-item><el-form-item label="收件目录"><el-input v-model="mailboxForm.folder" maxlength="128" placeholder="INBOX"/></el-form-item><el-alert title="密码会使用 AES-GCM 加密后保存；建议在邮箱后台创建独立授权码，不要使用网页登录密码。" type="warning" :closable="false"/></el-form><template #footer><el-button @click="mailboxDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="createEmailMailbox">确认接入</el-button></template></el-dialog>
    <el-dialog v-model="credentialDialog" title="生成渠道接入凭据" width="540px"><el-form label-position="top"><el-form-item label="接入名称"><el-input v-model="credentialForm.displayName" maxlength="128" placeholder="例如：官网询价表单"/></el-form-item><el-form-item label="渠道类型"><el-select v-model="credentialForm.channelType"><el-option v-for="(label, value) in channelLabels" :key="value" :label="label" :value="value"/><el-option label="其他系统" value="CUSTOM"/></el-select></el-form-item><el-alert title="服务端使用 HMAC-SHA256 验证请求签名，并拒绝超过 5 分钟的请求。" type="info" :closable="false"/></el-form><template #footer><el-button @click="credentialDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="createChannelCredential">生成凭据</el-button></template></el-dialog>
    <el-dialog v-model="credentialResultDialog" title="接入凭据已生成" width="620px" :close-on-click-modal="false"><el-alert title="签名密钥仅显示这一次，请立即保存到调用方的安全配置中。" type="warning" :closable="false"/><div v-if="createdCredential" class="credential-result"><label>请求地址</label><div><code>{{ createdCredential.endpointPath }}</code><el-button :icon="CopyDocument" circle title="复制地址" @click="copyCredential(createdCredential.endpointPath)"/></div><label>签名密钥</label><div><code>{{ createdCredential.signingSecret }}</code><el-button :icon="CopyDocument" circle title="复制密钥" @click="copyCredential(createdCredential.signingSecret)"/></div><small>签名内容：X-Nexa-Timestamp + “.” + 原始 JSON 请求体；签名算法：HMAC-SHA256，十六进制小写。</small></div><template #footer><el-button type="primary" @click="credentialResultDialog=false; createdCredential=undefined">我已安全保存</el-button></template></el-dialog>
    <el-dialog v-model="approvalRuleDialog" :title="editingApprovalRuleId ? '编辑审批规则' : '新增审批规则'" width="580px"><el-form label-position="top"><el-form-item label="规则名称"><el-input v-model="approvalRuleForm.name" maxlength="128" placeholder="例如：大额报价主管审批"/></el-form-item><el-form-item label="触发类型"><el-select v-model="approvalRuleForm.ruleType"><el-option v-for="(label, value) in approvalRuleLabels" :key="value" :label="label" :value="value"/></el-select></el-form-item><el-form-item v-if="approvalRuleForm.ruleType === 'AMOUNT_THRESHOLD'" label="报价金额阈值"><el-input-number v-model="approvalRuleForm.thresholdAmount" :min="0.01" :precision="2" controls-position="right"/></el-form-item><el-form-item v-else-if="approvalRuleForm.ruleType === 'VIP_CUSTOMER'" label="客户标签"><el-select v-model="approvalRuleForm.conditionValue"><el-option label="重点客户" value="VIP"/><el-option label="需关注客户" value="AT-RISK"/></el-select></el-form-item><el-form-item v-else label="贸易条款"><el-select v-model="approvalRuleForm.conditionValue"><el-option label="完税后交货（DDP）" value="DDP"/><el-option label="成本、保险加运费（CIF）" value="CIF"/><el-option label="成本加运费（CFR）" value="CFR"/></el-select></el-form-item><el-switch v-model="approvalRuleForm.enabled" active-text="启用规则"/></el-form><template #footer><el-button @click="approvalRuleDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveApprovalRule">保存规则</el-button></template></el-dialog>
  </section>
</template>
