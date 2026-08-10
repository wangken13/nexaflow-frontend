<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { tradeApi, type AuditLogView, type MemberView } from '../api/trade'
import { useAuthStore } from '../stores/auth'
import { formatDateTime, humanizeSystemText, roleLabels } from '../utils/presentation'
import { workEmailValidationMessage } from '../utils/validation'

const auth = useAuthStore()
const members = ref<MemberView[]>([])
const audits = ref<AuditLogView[]>([])
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

async function loadMembers() { members.value = await tradeApi.members() }
async function loadAudits() { audits.value = await tradeApi.auditLogs(auditModule.value, auditKeyword.value) }
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
onMounted(async () => { await Promise.all([loadMembers(), loadAudits()]) })
</script>

<template>
  <section class="page-shell governance-page">
    <header class="page-head"><div><p class="section-kicker">组织、权限与合规记录</p><h1>企业治理</h1><p>管理团队访问边界，追踪关键管理操作。</p></div><el-button v-if="activeTab === 'members'" type="primary" :icon="Plus" @click="memberDialog = true">新增成员</el-button></header>
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
      </el-tabs>
    </section>
    <el-dialog v-model="memberDialog" title="新增团队成员" width="540px">
      <el-form ref="memberFormRef" :model="form" :rules="memberFormRules" label-position="top"><div class="form-grid"><el-form-item label="成员姓名" prop="displayName"><el-input v-model="form.displayName" maxlength="128"/></el-form-item><el-form-item label="登录账号" prop="username"><el-input v-model="form.username" maxlength="64"/></el-form-item><el-form-item label="工作邮箱" prop="email"><el-input v-model="form.email" maxlength="255" placeholder="name@company.com"/></el-form-item><el-form-item label="初始密码" prop="password"><el-input v-model="form.password" type="password" show-password maxlength="72"/></el-form-item></div><el-form-item label="成员角色" prop="role"><el-select v-model="form.role"><el-option v-for="(label, value) in roleLabels" :key="value" :label="label" :value="value"/></el-select></el-form-item></el-form>
      <template #footer><el-button @click="memberDialog = false">取消</el-button><el-button type="primary" :loading="saving" @click="createMember">确认新增</el-button></template>
    </el-dialog>
  </section>
</template>
