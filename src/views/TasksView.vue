<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Plus } from '@element-plus/icons-vue'
import { tradeApi, type CustomerView, type InquiryView, type OrderView, type QuotationView, type TaskView } from '../api/trade'
import { formatDateTime, labelOf, priorityLabels } from '../utils/presentation'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../security/permissions'

const auth = useAuthStore()

const tasks = ref<TaskView[]>([])
const customers = ref<CustomerView[]>([])
const inquiries = ref<InquiryView[]>([])
const orders = ref<OrderView[]>([])
const quotations = ref<QuotationView[]>([])
const dialog = ref(false)
const filter = ref('OPEN')
const form = ref({ title: '', priority: 'NORMAL', dueAt: '', relatedType: '', relatedId: '' })
const visible = computed(() => filter.value === 'ALL' ? tasks.value : tasks.value.filter(item => item.status === filter.value))
async function load() {
  [tasks.value, customers.value, inquiries.value, orders.value, quotations.value] = await Promise.all([
    tradeApi.tasks(), tradeApi.customers(), tradeApi.inquiries(), tradeApi.orders(), tradeApi.quotations()
  ])
}
function customerName(customerId: string) {
  return customers.value.find(item => item.id === customerId)?.name || '客户资料待同步'
}
function relatedBusiness(task: TaskView) {
  if (!task.relatedType || !task.relatedId) return { type: '独立任务', name: '不关联其他业务' }
  if (task.relatedType === 'INQUIRY') {
    const inquiry = inquiries.value.find(item => item.id === task.relatedId)
    return inquiry
      ? { type: '客户询盘', name: `${customerName(inquiry.customerId)} · ${inquiry.subject}` }
      : { type: '客户询盘', name: '原询盘记录已不存在' }
  }
  if (task.relatedType === 'CUSTOMER') {
    return { type: '客户跟进', name: customerName(task.relatedId) }
  }
  if (task.relatedType === 'ORDER') {
    const order = orders.value.find(item => item.id === task.relatedId)
    return order
      ? { type: '订单交付', name: `${order.customerName} · ${order.productName}` }
      : { type: '订单交付', name: '原订单记录已不存在' }
  }
  if (task.relatedType === 'QUOTATION') {
    const quotation = quotations.value.find(item => item.id === task.relatedId)
    return quotation
      ? { type: '客户报价', name: `${customerName(quotation.customerId)} · ${quotation.quotationNo || '报价单'}` }
      : { type: '客户报价', name: '原报价记录已不存在' }
  }
  return { type: '相关业务', name: '详情请在对应业务中查看' }
}
async function save() {
  if (!form.value.title.trim() || !form.value.dueAt) return ElMessage.warning('请填写任务内容和提醒时间')
  await tradeApi.createTask(form.value)
  dialog.value = false
  form.value = { title: '', priority: 'NORMAL', dueAt: '', relatedType: '', relatedId: '' }
  await load()
  ElMessage.success('跟进任务已创建')
}
async function complete(id: string) { await tradeApi.completeTask(id); await load(); ElMessage.success('任务已完成') }
onMounted(load)
</script>
<template>
  <section class="page-shell">
    <header class="page-head"><div><p class="section-kicker">团队待办</p><h1>跟进任务</h1><p>查看每项任务对应的客户与业务，按提醒时间及时推进。</p></div><el-button v-if="hasPermission(auth.role, 'task:write')" type="primary" :icon="Plus" @click="dialog=true">新建任务</el-button></header>
    <section class="surface table-surface">
      <div class="table-toolbar"><el-segmented v-model="filter" :options="[{label:'待完成',value:'OPEN'},{label:'已完成',value:'DONE'},{label:'全部任务',value:'ALL'}]"/></div>
      <el-table :data="visible" row-key="id">
        <el-table-column prop="title" label="待办事项" min-width="250"/>
        <el-table-column label="关联客户与业务" min-width="300"><template #default="{row}"><div class="business-reference"><span>{{ relatedBusiness(row).type }}</span><strong>{{ relatedBusiness(row).name }}</strong></div></template></el-table-column>
        <el-table-column label="提醒时间" width="190"><template #default="{row}">{{ formatDateTime(row.dueAt) }}</template></el-table-column>
        <el-table-column label="紧急程度" width="120"><template #default="{row}"><span class="state-chip" :class="{ danger: row.priority === 'HIGH', muted: row.priority === 'LOW' }">{{ labelOf(priorityLabels, row.priority, '普通') }}</span></template></el-table-column>
        <el-table-column label="处理状态" width="120"><template #default="{row}"><el-button v-if="row.status !== 'DONE' && hasPermission(auth.role, 'task:write')" :icon="Check" text @click="complete(row.id)">标记完成</el-button><span v-else-if="row.status === 'DONE'" class="done-label">已完成</span><span v-else class="state-chip muted">待处理</span></template></el-table-column>
      </el-table>
      <div v-if="!visible.length" class="empty-compact">这里暂时没有需要处理的任务</div>
    </section>
    <el-dialog v-model="dialog" title="新建跟进任务" width="520px"><el-form label-position="top"><el-form-item label="待办事项"><el-input v-model="form.title" placeholder="例如：向客户确认包装规格"/></el-form-item><div class="form-grid"><el-form-item label="紧急程度"><el-select v-model="form.priority"><el-option label="紧急" value="HIGH"/><el-option label="普通" value="NORMAL"/><el-option label="低优先级" value="LOW"/></el-select></el-form-item><el-form-item label="提醒时间"><el-date-picker v-model="form.dueAt" value-format="YYYY-MM-DDTHH:mm:ss" type="datetime" placeholder="选择提醒时间"/></el-form-item></div></el-form><template #footer><el-button @click="dialog=false">取消</el-button><el-button type="primary" @click="save">创建任务</el-button></template></el-dialog>
  </section>
</template>
