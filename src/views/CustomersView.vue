<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import { tradeApi, type CustomerDetailView, type CustomerView } from '../api/trade'
import { contactPositionLabel, contactPositionOptions, countryLabel, countryOptions, customerTagLabel, customerTagOptions, formatDateTime } from '../utils/presentation'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../security/permissions'

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
const tagOptions = ref(customerTagOptions)
const filtered = computed(() => customers.value.filter(item => `${item.name}${item.country}${item.tag}`.toLowerCase().includes(keyword.value.toLowerCase())))

async function load() { loading.value = true; try { const [items, tags] = await Promise.all([tradeApi.customers(), tradeApi.customerTags()]); customers.value = items; tagOptions.value = tags.map(value => ({ value, label: customerTagLabel(value) })); if (selected.value) await openDetail(selected.value.customer.id) } finally { loading.value = false } }
async function openDetail(id: string) { selected.value = await tradeApi.customer(id) }
function openCreate() { editingId.value = ''; customerForm.value = { name: '', country: '', tag: '' }; customerDialog.value = true }
function openEdit() { if (!selected.value) return; editingId.value = selected.value.customer.id; customerForm.value = { name: selected.value.customer.name, country: selected.value.customer.country, tag: selected.value.customer.tag }; customerDialog.value = true }
async function saveCustomer() { if (!customerForm.value.name.trim()) return ElMessage.warning('请输入客户名称'); editingId.value ? await tradeApi.updateCustomer(editingId.value, customerForm.value) : await tradeApi.createCustomer(customerForm.value); customerDialog.value = false; ElMessage.success('客户资料已保存'); await load() }
async function removeCustomer() { if (!selected.value) return; await ElMessageBox.confirm('删除客户将同时删除联系人和跟进记录，确认继续？', '删除客户', { type: 'warning' }); await tradeApi.deleteCustomer(selected.value.customer.id); selected.value = null; await load(); ElMessage.success('客户已删除') }
async function addContact() { if (!selected.value || !contactForm.value.name.trim()) return; await tradeApi.addContact(selected.value.customer.id, contactForm.value); contactDialog.value = false; contactForm.value = { name: '', email: '', phone: '', position: '', primary: false }; await openDetail(selected.value.customer.id); ElMessage.success('联系人已添加') }
async function addFollowup() { if (!selected.value || !followup.value.trim()) return; await tradeApi.addFollowup(selected.value.customer.id, { type: 'NOTE', content: followup.value, operatorName: '当前用户' }); followup.value = ''; await openDetail(selected.value.customer.id); ElMessage.success('跟进记录已保存') }
onMounted(load)
</script>

<template>
  <section class="page-shell">
    <header class="page-head"><div><p class="section-kicker">客户资产</p><h1>客户中心</h1><p>把联系人、沟通记录和商机脉络放在同一份客户档案里。</p></div><el-button v-if="hasPermission(auth.role, 'customer:write')" type="primary" :icon="Plus" @click="openCreate">新建客户</el-button></header>
    <div class="master-detail">
      <section v-loading="loading" class="surface master-pane">
        <el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索客户、国家或标签" clearable />
        <button v-for="item in filtered" :key="item.id" class="record-button" :class="{ active: selected?.customer.id === item.id }" @click="openDetail(item.id)"><div><strong>{{ item.name }}</strong><small>{{ countryLabel(item.country) }}</small></div><span>{{ customerTagLabel(item.tag) }}</span></button>
        <div v-if="!filtered.length" class="empty-compact">暂无匹配客户</div>
      </section>
      <section class="surface detail-pane">
        <template v-if="selected">
          <div class="surface-head"><div><h2>{{ selected.customer.name }}</h2><p>{{ countryLabel(selected.customer.country) }} · {{ customerTagLabel(selected.customer.tag) }}</p></div><div v-if="hasPermission(auth.role, 'customer:write')" class="action-row"><el-button :icon="Edit" circle title="编辑客户" @click="openEdit"/><el-button v-if="hasPermission(auth.role, 'customer:delete')" :icon="Delete" circle title="删除客户" @click="removeCustomer"/></div></div>
          <div class="detail-section"><div class="surface-head"><h3>联系人</h3><el-button v-if="hasPermission(auth.role, 'customer:write')" text :icon="Plus" @click="contactDialog = true">添加联系人</el-button></div><div class="contact-grid"><article v-for="item in selected.contacts" :key="item.id" class="contact-item"><span v-if="item.primary">主要联系人</span><strong>{{ item.name }}</strong><small>{{ contactPositionLabel(item.position) }}</small><p>{{ item.email || item.phone || '联系方式待补充' }}</p></article></div><div v-if="!selected.contacts.length" class="empty-compact">还没有联系人</div></div>
          <div class="detail-section timeline-section"><div class="surface-head"><h3>跟进时间线</h3></div><div v-if="hasPermission(auth.role, 'customer:write')" class="quick-entry"><el-input v-model="followup" type="textarea" :rows="2" placeholder="记录电话、邮件、会议或客户偏好"/><el-button type="primary" @click="addFollowup">保存记录</el-button></div><div v-for="item in selected.timeline" :key="item.id" class="timeline-item"><i></i><div><strong>{{ item.content }}</strong><small>{{ item.operatorName || '团队成员' }} · {{ formatDateTime(item.createdAt) }}</small></div></div><div v-if="!selected.timeline.length" class="empty-compact">还没有跟进记录</div></div>
        </template>
        <div v-else class="empty-state">从左侧选择客户查看完整档案</div>
      </section>
    </div>
    <el-dialog v-model="customerDialog" :title="editingId ? '编辑客户' : '新建客户'" width="480px"><el-form label-position="top"><el-form-item label="客户名称"><el-input v-model="customerForm.name"/></el-form-item><el-form-item label="国家/地区"><el-select v-model="customerForm.country" filterable clearable placeholder="选择国家或地区"><el-option v-for="item in countryOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="客户标签"><el-select v-model="customerForm.tag" clearable placeholder="选择客户分层"><el-option v-for="item in tagOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item></el-form><template #footer><el-button @click="customerDialog=false">取消</el-button><el-button type="primary" @click="saveCustomer">保存客户</el-button></template></el-dialog>
    <el-dialog v-model="contactDialog" title="添加联系人" width="520px"><el-form label-position="top"><div class="form-grid"><el-form-item label="姓名"><el-input v-model="contactForm.name"/></el-form-item><el-form-item label="职位"><el-select v-model="contactForm.position" clearable placeholder="选择联系人职能"><el-option v-for="item in contactPositionOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="邮箱"><el-input v-model="contactForm.email"/></el-form-item><el-form-item label="电话"><el-input v-model="contactForm.phone"/></el-form-item></div><el-checkbox v-model="contactForm.primary">设为主要联系人</el-checkbox></el-form><template #footer><el-button @click="contactDialog=false">取消</el-button><el-button type="primary" @click="addContact">保存联系人</el-button></template></el-dialog>
  </section>
</template>
