<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { tradeApi, type AiProviderStatus, type AuditLogView, type ChannelConfigView, type KnowledgeArticleView, type MemberView, type SubscriptionView } from '../api/trade'
import { useAuthStore } from '../stores/auth'
import { formatDateTime, humanizeSystemText, roleLabels } from '../utils/presentation'
import { workEmailValidationMessage } from '../utils/validation'

const auth = useAuthStore()
const members = ref<MemberView[]>([])
const audits = ref<AuditLogView[]>([])
const aiProvider = ref<AiProviderStatus>()
const aiStatusLoading = ref(false)
const aiStatusError = ref('')
const knowledge = ref<KnowledgeArticleView[]>([])
const channels = ref<ChannelConfigView[]>([])
const subscription = ref<SubscriptionView>()
const knowledgeDialog = ref(false)
const channelDialog = ref(false)
const editingKnowledgeId = ref('')
const knowledgeForm = ref({ title: '', category: 'PRODUCT', content: '', active: true })
const channelForm = ref({ channelType: 'EMAIL', displayName: '', accountRef: '', enabled: false })
const activeTab = ref('members')
const memberDialog = ref(false)
const saving = ref(false)
const auditKeyword = ref('')
const auditModule = ref('')
const form = ref({ username: '', password: '', displayName: '', email: '', role: 'SALES' })
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
  MEMBER_CREATED: '新增成员', MEMBER_ROLE_CHANGED: '调整角色', MEMBER_STATUS_CHANGED: '变更账号状态'
}
const activeMembers = computed(() => members.value.filter(item => item.status === 'ACTIVE').length)
const privilegedMembers = computed(() => members.value.filter(item => ['OWNER', 'ADMIN'].includes(item.role)).length)
const canManageAi = computed(() => ['OWNER', 'ADMIN'].includes(auth.role))
const canManageSettings = computed(() => ['OWNER', 'ADMIN'].includes(auth.role))
const categoryLabels: Record<string, string> = { PRODUCT: '产品资料', PRICING: '价格规则', DELIVERY: '交付说明', POLICY: '企业政策', FAQ: '常见问题' }
const channelLabels: Record<string, string> = { EMAIL: '企业邮箱', WEBSITE: '网站表单', WHATSAPP: 'WhatsApp', WECHAT_WORK: '企业微信' }

async function loadMembers() { members.value = await tradeApi.members() }
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
  if (canManageSettings.value) [channels.value, subscription.value] = await Promise.all([tradeApi.channels(), tradeApi.subscription()])
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
onMounted(async () => {
  await Promise.all([loadMembers(), loadAudits(), loadAiProviderStatus(), loadCommercialSettings()])
})
</script>

<template>
  <section class="page-shell governance-page">
    <header class="page-head"><div><p class="section-kicker">组织、知识与商业配置</p><h1>企业治理</h1><p>管理团队访问边界、企业知识、业务渠道和套餐用量。</p></div><el-button v-if="activeTab === 'members'" type="primary" :icon="Plus" @click="memberDialog = true">新增成员</el-button><el-button v-else-if="activeTab === 'knowledge'" type="primary" :icon="Plus" @click="openKnowledge()">新增知识</el-button><el-button v-else-if="activeTab === 'channels'" type="primary" :icon="Plus" @click="openChannel()">配置渠道</el-button></header>
    <section class="governance-summary">
      <div><span>团队成员</span><strong>{{ members.length }}</strong></div>
      <div><span>正常账号</span><strong>{{ activeMembers }}</strong></div>
      <div><span>管理账号</span><strong>{{ privilegedMembers }}</strong></div>
      <div><span>审计事件</span><strong>{{ audits.length }}</strong></div>
    </section>
    <section class="surface governance-surface">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="团队成员" name="members">
          <el-table :data="members" row-key="id">
            <el-table-column label="成员" min-width="210"><template #default="{ row }"><div class="member-cell"><span>{{ row.displayName.slice(0, 1) }}</span><div><strong>{{ row.displayName }}</strong><small>{{ row.username }}<template v-if="row.email"> · {{ row.email }}</template></small></div></div></template></el-table-column>
            <el-table-column label="角色" width="190"><template #default="{ row }"><el-select :model-value="row.role" :disabled="auth.role !== 'OWNER' || row.username === 'admin'" @change="updateRole(row, String($event))"><el-option v-for="(label, value) in roleLabels" :key="value" :label="label" :value="value"/></el-select></template></el-table-column>
            <el-table-column label="状态" width="110"><template #default="{ row }"><span class="state-chip" :class="{ muted: row.status !== 'ACTIVE' }">{{ row.status === 'ACTIVE' ? '正常' : '已停用' }}</span></template></el-table-column>
            <el-table-column label="加入时间" width="180"><template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template></el-table-column>
            <el-table-column label="操作" width="110" align="right"><template #default="{ row }"><el-button v-if="row.username !== 'admin'" text @click="toggleStatus(row)">{{ row.status === 'ACTIVE' ? '停用' : '启用' }}</el-button></template></el-table-column>
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
        <el-tab-pane label="企业知识库" name="knowledge">
          <div class="knowledge-intro"><div><span>AI 可信依据</span><h2>企业知识库</h2><p>启用的内容会自动进入询盘分析上下文，模型不得补充知识库之外的企业承诺。</p></div><strong>{{ knowledge.filter(item => item.active).length }} 条启用</strong></div>
          <el-table :data="knowledge" row-key="id">
            <el-table-column label="知识条目" min-width="260"><template #default="{ row }"><div class="knowledge-title"><strong>{{ row.title }}</strong><small>{{ categoryLabels[row.category] || row.category }} · {{ formatDateTime(row.updatedAt) }}</small></div></template></el-table-column>
            <el-table-column label="内容摘要" min-width="320"><template #default="{ row }"><span class="knowledge-excerpt">{{ row.content }}</span></template></el-table-column>
            <el-table-column label="状态" width="100"><template #default="{ row }"><span class="state-chip" :class="{ muted: !row.active }">{{ row.active ? '已启用' : '已停用' }}</span></template></el-table-column>
            <el-table-column v-if="canManageSettings" label="操作" width="110" align="right"><template #default="{ row }"><el-button :icon="Edit" text circle title="编辑知识" @click="openKnowledge(row)"/><el-button :icon="Delete" text circle title="删除知识" @click="removeKnowledge(row)"/></template></el-table-column>
          </el-table><div v-if="!knowledge.length" class="empty-compact">还没有企业知识，AI 只能依据客户原文进行判断</div>
        </el-tab-pane>
        <el-tab-pane v-if="canManageSettings" label="渠道接入" name="channels">
          <div class="channel-grid"><article v-for="item in channels" :key="item.id" class="channel-item"><div><span>{{ channelLabels[item.channelType] || item.channelType }}</span><strong>{{ item.displayName }}</strong><small>{{ item.accountRef || '尚未填写业务账号' }}</small></div><div><span class="state-chip" :class="{ muted: !item.enabled }">{{ item.enabled ? '已启用' : '未启用' }}</span><el-button :icon="Edit" text circle title="编辑渠道" @click="openChannel(item)"/></div></article><div v-if="!channels.length" class="empty-compact">尚未配置客户消息渠道</div></div>
        </el-tab-pane>
        <el-tab-pane v-if="canManageSettings" label="套餐与用量" name="subscription">
          <div v-if="subscription" class="subscription-layout"><div class="plan-summary"><span>当前套餐</span><h2>{{ subscription.planName }}</h2><p>¥ {{ subscription.monthlyPrice }} / 月</p><strong>{{ subscription.planCode }}</strong></div><div class="usage-list"><div><p><span>团队成员</span><strong>{{ subscription.membersUsed }} / {{ subscription.memberLimit }}</strong></p><el-progress :percentage="usagePercent(subscription.membersUsed, subscription.memberLimit)" :show-text="false"/></div><div><p><span>客户档案</span><strong>{{ subscription.customersUsed }} / {{ subscription.customerLimit }}</strong></p><el-progress :percentage="usagePercent(subscription.customersUsed, subscription.customerLimit)" :show-text="false"/></div><div><p><span>AI 分析额度</span><strong>{{ subscription.aiCreditsUsed }} / {{ subscription.aiCreditLimit }}</strong></p><el-progress :percentage="usagePercent(subscription.aiCreditsUsed, subscription.aiCreditLimit)" :show-text="false"/></div></div></div>
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
    <el-dialog v-model="knowledgeDialog" :title="editingKnowledgeId ? '编辑知识' : '新增知识'" width="660px"><el-form label-position="top"><div class="form-grid"><el-form-item label="知识标题"><el-input v-model="knowledgeForm.title" maxlength="200"/></el-form-item><el-form-item label="知识分类"><el-select v-model="knowledgeForm.category"><el-option v-for="(label, value) in categoryLabels" :key="value" :label="label" :value="value"/></el-select></el-form-item></div><el-form-item label="业务内容"><el-input v-model="knowledgeForm.content" type="textarea" :rows="10" maxlength="20000" show-word-limit placeholder="填写真实产品参数、价格规则、交期或企业政策"/></el-form-item><el-switch v-model="knowledgeForm.active" active-text="允许 AI 引用"/></el-form><template #footer><el-button @click="knowledgeDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveKnowledge">保存知识</el-button></template></el-dialog>
    <el-dialog v-model="channelDialog" title="配置客户渠道" width="560px"><el-form label-position="top"><el-form-item label="渠道类型"><el-select v-model="channelForm.channelType"><el-option v-for="(label, value) in channelLabels" :key="value" :label="label" :value="value"/></el-select></el-form-item><el-form-item label="显示名称"><el-input v-model="channelForm.displayName" maxlength="100" placeholder="例如：销售公共邮箱"/></el-form-item><el-form-item label="业务账号标识"><el-input v-model="channelForm.accountRef" maxlength="255" placeholder="邮箱地址、站点名称或企业账号，不要填写密码"/></el-form-item><el-alert title="访问密钥和邮箱密码必须通过服务器环境变量配置，系统不会在这里保存明文密钥。" type="info" :closable="false"/><el-switch v-model="channelForm.enabled" active-text="启用渠道"/></el-form><template #footer><el-button @click="channelDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveChannel">保存配置</el-button></template></el-dialog>
  </section>
</template>
