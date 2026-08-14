<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, Edit, Plus, Search, Upload } from '@element-plus/icons-vue'
import { tradeApi, type BulkImportResult, type CustomerDetailView, type CustomerView, type MemberView } from '../api/trade'
import ImportResultDialog from '../components/ImportResultDialog.vue'
import { contactPositionLabel, contactPositionOptions, countryLabel, countryOptions, customerTagLabel, customerTagOptions, formatDateTime } from '../utils/presentation'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../security/permissions'
import { downloadCsv, parseCsv } from '../utils/csv'

const auth = useAuthStore()

const customers = ref<CustomerView[]>([])
const selected = ref<CustomerDetailView | null>(null)
const keyword = ref('')
const loading = ref(false)
const customerDialog = ref(false)
const contactDialog = ref(false)
const editingId = ref('')
const customerForm = ref({ name: '', country: '', tag: '' })
const contactForm = ref({ name: '', email: '', phone: '', position: '', primary: false })
const followup = ref('')
const importInput = ref<HTMLInputElement>()
const importing = ref(false)
const members = ref<MemberView[]>([])
const ownerDialog = ref(false)
const selectedOwnerId = ref('')
const importResult = ref<BulkImportResult>()
const importResultDialog = ref(false)
const tagOptions = ref(customerTagOptions)
const filtered = computed(() => customers.value.filter(item => `${item.name}${item.country}${item.tag}`.toLowerCase().includes(keyword.value.toLowerCase())))

async function load() { loading.value = true; try { const [items, tags, team] = await Promise.all([tradeApi.customers(), tradeApi.customerTags(), ['OWNER', 'ADMIN'].includes(auth.role) ? tradeApi.members() : Promise.resolve([])]); customers.value = items; members.value = team; tagOptions.value = tags.map(value => ({ value, label: customerTagLabel(value) })); if (selected.value) await openDetail(selected.value.customer.id) } finally { loading.value = false } }
async function openDetail(id: string) { selected.value = await tradeApi.customer(id) }
function openCreate() { editingId.value = ''; customerForm.value = { name: '', country: '', tag: '' }; customerDialog.value = true }
function openEdit() { if (!selected.value) return; editingId.value = selected.value.customer.id; customerForm.value = { name: selected.value.customer.name, country: selected.value.customer.country, tag: selected.value.customer.tag }; customerDialog.value = true }
async function saveCustomer() { if (!customerForm.value.name.trim()) return ElMessage.warning('请输入客户名称'); editingId.value ? await tradeApi.updateCustomer(editingId.value, customerForm.value) : await tradeApi.createCustomer(customerForm.value); customerDialog.value = false; ElMessage.success('客户资料已保存'); await load() }
async function removeCustomer() { if (!selected.value) return; await ElMessageBox.confirm('删除客户将同时删除联系人和跟进记录，确认继续？', '删除客户', { type: 'warning' }); await tradeApi.deleteCustomer(selected.value.customer.id); selected.value = null; await load(); ElMessage.success('客户已删除') }
function openOwnerAssignment() { if (!selected.value) return; selectedOwnerId.value = selected.value.customer.ownerId; ownerDialog.value = true }
async function assignOwner() { if (!selected.value || !selectedOwnerId.value) return ElMessage.warning('请选择客户负责人'); await tradeApi.assignCustomerOwner(selected.value.customer.id, selectedOwnerId.value); ownerDialog.value = false; await load(); ElMessage.success('客户负责人已更新') }
async function addContact() { if (!selected.value || !contactForm.value.name.trim()) return; await tradeApi.addContact(selected.value.customer.id, contactForm.value); contactDialog.value = false; contactForm.value = { name: '', email: '', phone: '', position: '', primary: false }; await openDetail(selected.value.customer.id); ElMessage.success('联系人已添加') }
async function addFollowup() { if (!selected.value || !followup.value.trim()) return; await tradeApi.addFollowup(selected.value.customer.id, { type: 'NOTE', content: followup.value, operatorName: '当前用户' }); followup.value = ''; await openDetail(selected.value.customer.id); ElMessage.success('跟进记录已保存') }
async function importCustomers(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 2 * 1024 * 1024) return ElMessage.warning('CSV 文件不能超过 2MB')
  importing.value = true
  try {
    const rows = parseCsv(await file.text()).map(row => ({ name: row.name || row['客户名称'], country: row.country || row['国家地区'] || '', tag: row.tag || row['客户标签'] || '' }))
    if (rows.length > 500) throw new Error('单次最多导入 500 条客户')
    const result = await tradeApi.importCustomers(rows)
    await load()
    importResult.value = result; importResultDialog.value = true
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '客户导入失败') }
  finally { importing.value = false }
}
async function exportCustomers() {
  try {
    const rows = await tradeApi.exportCustomers()
    downloadCsv('nexaflow-customers.csv', [
      { key: 'name', label: '客户名称' }, { key: 'country', label: '国家地区' },
      { key: 'tag', label: '客户标签' }, { key: 'createdAt', label: '创建时间' }
    ], rows)
    ElMessage.success(`已导出 ${rows.length} 条客户数据`)
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '客户导出失败') }
}
onMounted(load)
</script>

<template>
  <section class="page-shell">
    <header class="page-head"><div><p class="section-kicker">客户资产</p><h1>客户中心</h1><p>把联系人、沟通记录和商机脉络放在同一份客户档案里。</p></div><div class="action-row"><el-button v-if="hasPermission(auth.role, 'data:export')" :icon="Download" @click="exportCustomers">导出数据</el-button><template v-if="hasPermission(auth.role, 'customer:write')"><input ref="importInput" class="visually-hidden" type="file" accept=".csv,text/csv" @change="importCustomers"><el-button :icon="Upload" :loading="importing" @click="importInput?.click()">导入 CSV</el-button><el-button type="primary" :icon="Plus" @click="openCreate">新建客户</el-button></template></div></header>
    <div class="master-detail">
      <section v-loading="loading" class="surface master-pane">
        <el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索客户、国家或标签" clearable />
        <button v-for="item in filtered" :key="item.id" class="record-button" :class="{ active: selected?.customer.id === item.id }" @click="openDetail(item.id)"><div><strong>{{ item.name }}</strong><small>{{ countryLabel(item.country) }}</small></div><span>{{ customerTagLabel(item.tag) }}</span></button>
        <div v-if="!filtered.length" class="empty-compact">暂无匹配客户</div>
      </section>
      <section class="surface detail-pane">
        <template v-if="selected">
          <div class="surface-head"><div><h2>{{ selected.customer.name }}</h2><p>{{ countryLabel(selected.customer.country) }} · {{ customerTagLabel(selected.customer.tag) }} · 负责人：{{ selected.customer.ownerName || '待分配' }}<template v-if="selected.customer.departmentName">（{{ selected.customer.departmentName }}）</template></p></div><div v-if="hasPermission(auth.role, 'customer:write')" class="action-row"><el-button v-if="['OWNER', 'ADMIN'].includes(auth.role)" text @click="openOwnerAssignment">转交客户</el-button><el-button :icon="Edit" circle title="编辑客户" @click="openEdit"/><el-button v-if="hasPermission(auth.role, 'customer:delete')" :icon="Delete" circle title="删除客户" @click="removeCustomer"/></div></div>
          <div class="detail-section"><div class="surface-head"><h3>联系人</h3><el-button v-if="hasPermission(auth.role, 'customer:write')" text :icon="Plus" @click="contactDialog = true">添加联系人</el-button></div><div class="contact-grid"><article v-for="item in selected.contacts" :key="item.id" class="contact-item"><span v-if="item.primary">主要联系人</span><strong>{{ item.name }}</strong><small>{{ contactPositionLabel(item.position) }}</small><p>{{ item.email || item.phone || '联系方式待补充' }}</p></article></div><div v-if="!selected.contacts.length" class="empty-compact">还没有联系人</div></div>
          <div class="detail-section timeline-section"><div class="surface-head"><h3>跟进时间线</h3></div><div v-if="hasPermission(auth.role, 'customer:write')" class="quick-entry"><el-input v-model="followup" type="textarea" :rows="2" placeholder="记录电话、邮件、会议或客户偏好"/><el-button type="primary" @click="addFollowup">保存记录</el-button></div><div v-for="item in selected.timeline" :key="item.id" class="timeline-item"><i></i><div><strong>{{ item.content }}</strong><small>{{ item.operatorName || '团队成员' }} · {{ formatDateTime(item.createdAt) }}</small></div></div><div v-if="!selected.timeline.length" class="empty-compact">还没有跟进记录</div></div>
        </template>
        <div v-else class="empty-state">从左侧选择客户查看完整档案</div>
      </section>
    </div>
    <el-dialog v-model="customerDialog" :title="editingId ? '编辑客户' : '新建客户'" width="480px"><el-form label-position="top"><el-form-item label="客户名称"><el-input v-model="customerForm.name"/></el-form-item><el-form-item label="国家/地区"><el-select v-model="customerForm.country" filterable clearable placeholder="选择国家或地区"><el-option v-for="item in countryOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="客户标签"><el-select v-model="customerForm.tag" clearable placeholder="选择客户分层"><el-option v-for="item in tagOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item></el-form><template #footer><el-button @click="customerDialog=false">取消</el-button><el-button type="primary" @click="saveCustomer">保存客户</el-button></template></el-dialog>
    <el-dialog v-model="ownerDialog" title="转交客户" width="480px"><el-form label-position="top"><el-form-item label="新负责人"><el-select v-model="selectedOwnerId" filterable placeholder="选择团队成员"><el-option v-for="item in members.filter(member => member.status === 'ACTIVE')" :key="item.id" :label="`${item.displayName}${item.departmentName ? ` · ${item.departmentName}` : ''}`" :value="item.id"/></el-select></el-form-item></el-form><template #footer><el-button @click="ownerDialog=false">取消</el-button><el-button type="primary" @click="assignOwner">确认转交</el-button></template></el-dialog>
    <ImportResultDialog v-model="importResultDialog" :result="importResult" resource-label="客户资料"/>
    <el-dialog v-model="contactDialog" title="添加联系人" width="520px"><el-form label-position="top"><div class="form-grid"><el-form-item label="姓名"><el-input v-model="contactForm.name"/></el-form-item><el-form-item label="职位"><el-select v-model="contactForm.position" clearable placeholder="选择联系人职能"><el-option v-for="item in contactPositionOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="邮箱"><el-input v-model="contactForm.email"/></el-form-item><el-form-item label="电话"><el-input v-model="contactForm.phone"/></el-form-item></div><el-checkbox v-model="contactForm.primary">设为主要联系人</el-checkbox></el-form><template #footer><el-button @click="contactDialog=false">取消</el-button><el-button type="primary" @click="addContact">保存联系人</el-button></template></el-dialog>
  </section>
</template>
