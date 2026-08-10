<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus, Printer } from '@element-plus/icons-vue'
import { tradeApi, type CustomerView, type ProductView, type QuotationItemRequest, type QuotationView } from '../api/trade'
import { useAuthStore } from '../stores/auth'
import { currencyLabel, currencyOptions, destinationPortLabel, destinationPortOptions, formatDate, quotationStatusLabels, tradeTermLabel, tradeTermOptions } from '../utils/presentation'
import { hasPermission } from '../security/permissions'

const auth = useAuthStore()
const quotations = ref<QuotationView[]>([])
const customers = ref<CustomerView[]>([])
const products = ref<ProductView[]>([])
const selected = ref<QuotationView | null>(null)
const editor = ref(false)
const saving = ref(false)
const form = ref({ customerId: '', currency: 'USD', tradeTerm: 'FOB', destinationPort: '', freight: 0, validUntil: '', notes: '', items: [] as QuotationItemRequest[] })
const subtotal = computed(() => form.value.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0))
const total = computed(() => subtotal.value + form.value.freight)
const statusLabels = quotationStatusLabels
const transitionMap: Record<string, Array<{ value: string; label: string; approval?: boolean }>> = {
  DRAFT: [{ value: 'PENDING_APPROVAL', label: '提交审批' }],
  PENDING_APPROVAL: [{ value: 'DRAFT', label: '撤回修改' }, { value: 'APPROVED', label: '批准报价', approval: true }, { value: 'REJECTED', label: '驳回', approval: true }],
  APPROVED: [{ value: 'SENT', label: '标记已发送' }],
  SENT: [{ value: 'ACCEPTED', label: '客户接受' }, { value: 'REJECTED', label: '客户拒绝' }, { value: 'EXPIRED', label: '标记失效' }],
  REJECTED: [{ value: 'DRAFT', label: '重新编辑' }], EXPIRED: [{ value: 'DRAFT', label: '重新编辑' }]
}
const availableTransitions = computed(() => hasPermission(auth.role, 'quotation:write')
  ? (transitionMap[selected.value?.status || ''] || []).filter(item => !item.approval || hasPermission(auth.role, 'quotation:approve'))
  : [])
function customerName(customerId: string) { return customers.value.find(item => item.id === customerId)?.name || '客户资料待同步' }
async function load() { [quotations.value, customers.value, products.value] = await Promise.all([tradeApi.quotations(), tradeApi.customers(), tradeApi.products()]) }
function openCreate() { form.value = { customerId: '', currency: 'USD', tradeTerm: 'FOB', destinationPort: '', freight: 0, validUntil: '', notes: '', items: [] }; addLine(); editor.value = true }
function addLine() { form.value.items.push({ productId: '', productName: '', specification: '', quantity: 1, unitPrice: 0 }) }
function chooseProduct(index: number, productId: string) { const product = products.value.find(item => item.id === productId); if (!product) return; form.value.items[index] = { productId: product.id, productName: product.name, specification: product.specification, quantity: product.moq, unitPrice: product.unitPrice }; form.value.currency = product.currency }
async function save() { if (!form.value.customerId || form.value.items.some(item => !item.productName || item.quantity <= 0)) return ElMessage.warning('请选择客户并完善报价明细'); saving.value = true; try { const quote = await tradeApi.createQuotation(form.value); editor.value = false; await load(); selected.value = quote; ElMessage.success('报价单已创建') } finally { saving.value = false } }
async function select(item: QuotationView) { selected.value = await tradeApi.quotation(item.id) }
async function changeStatus(status: string) { if (!selected.value) return; try { selected.value = await tradeApi.updateQuotationStatus(selected.value.id, status); await load(); ElMessage.success('报价状态已更新') } catch (error) { ElMessage.error(error instanceof Error ? error.message : '状态更新失败') } }
function printQuote() { window.print() }
onMounted(load)
</script>

<template>
  <section class="page-shell quotation-page">
    <header class="page-head no-print"><div><p class="section-kicker">商业报价与版本状态</p><h1>报价中心</h1><p>用产品目录生成规范报价，统一币种、贸易条款、运费和有效期。</p></div><el-button v-if="hasPermission(auth.role, 'quotation:write')" type="primary" :icon="Plus" @click="openCreate">创建报价</el-button></header>
    <div class="master-detail">
      <section class="surface master-pane no-print"><div class="surface-head"><h2>报价记录</h2><span>{{ quotations.length }} 份</span></div><button v-for="item in quotations" :key="item.id" class="record-button" :class="{ active: selected?.id === item.id }" @click="select(item)"><div><strong>{{ item.quotationNo || '报价单' }}</strong><small>{{ customerName(item.customerId) }} · {{ item.currency }} {{ Number(item.totalAmount).toFixed(2) }}</small></div><span class="state-chip">{{ statusLabels[item.status] || '处理中' }}</span></button><div v-if="!quotations.length" class="empty-compact">还没有报价单</div></section>
      <section class="surface detail-pane quote-document">
        <template v-if="selected"><div class="quote-title"><div><span>客户报价单</span><h2>{{ selected.quotationNo || '报价单' }}</h2><small class="quote-status">{{ statusLabels[selected.status] || '处理中' }}</small></div><div class="no-print action-row"><el-button v-for="action in availableTransitions" :key="action.value" :type="action.value === 'APPROVED' ? 'primary' : 'default'" @click="changeStatus(action.value)">{{ action.label }}</el-button><el-button :icon="Printer" circle title="打印或导出报价单" @click="printQuote"/></div></div><div class="quote-meta"><div><label>客户</label><strong>{{ customerName(selected.customerId) }}</strong></div><div><label>贸易条款</label><strong>{{ tradeTermLabel(selected.tradeTerm) }}<template v-if="selected.destinationPort"> · {{ destinationPortLabel(selected.destinationPort) }}</template></strong></div><div><label>有效期</label><strong>{{ formatDate(selected.validUntil) }}</strong></div><div><label>报价币种</label><strong>{{ currencyLabel(selected.currency) }}</strong></div></div><el-table :data="selected.items" class="quote-table"><el-table-column type="index" label="序号" width="64"/><el-table-column prop="productName" label="产品" min-width="160"/><el-table-column prop="specification" label="规格" min-width="180"/><el-table-column prop="quantity" label="数量" width="90"/><el-table-column label="单价" width="120"><template #default="{ row }">{{ Number(row.unitPrice).toFixed(2) }}</template></el-table-column><el-table-column label="金额" width="130"><template #default="{ row }">{{ Number(row.amount).toFixed(2) }}</template></el-table-column></el-table><div class="quote-total"><span>运费 {{ selected.currency }} {{ Number(selected.freight).toFixed(2) }}</span><strong>总计 {{ selected.currency }} {{ Number(selected.totalAmount).toFixed(2) }}</strong></div><p v-if="selected.notes" class="quote-notes">{{ selected.notes }}</p></template>
        <div v-else class="empty-state">选择一份报价单查看完整明细</div>
      </section>
    </div>
    <el-drawer v-model="editor" title="创建专业报价单" size="760px"><el-form label-position="top"><div class="form-grid"><el-form-item label="客户"><el-select v-model="form.customerId" filterable placeholder="从客户中心选择"><el-option v-for="item in customers" :key="item.id" :label="item.name" :value="item.id"/></el-select></el-form-item><el-form-item label="报价币种"><el-select v-model="form.currency"><el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="贸易条款"><el-select v-model="form.tradeTerm"><el-option v-for="item in tradeTermOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="目的港"><el-select v-model="form.destinationPort" filterable clearable placeholder="选择目的港"><el-option v-for="item in destinationPortOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="报价有效期"><el-date-picker v-model="form.validUntil" value-format="YYYY-MM-DD" type="date" placeholder="选择截止日期"/></el-form-item><el-form-item label="预计运费"><el-input-number v-model="form.freight" :min="0" :precision="2"/></el-form-item></div><div class="line-editor"><div class="surface-head"><h3>报价明细</h3><el-button text :icon="Plus" @click="addLine">添加产品</el-button></div><div v-for="(line,index) in form.items" :key="index" class="quote-line"><el-select v-model="line.productId" filterable placeholder="选择产品" @change="chooseProduct(index, String($event))"><el-option v-for="item in products.filter(product => product.active)" :key="item.id" :label="`${item.sku} · ${item.name}`" :value="item.id"/></el-select><el-input v-model="line.specification" placeholder="产品规格"/><el-input-number v-model="line.quantity" :min="1"/><el-input-number v-model="line.unitPrice" :min="0" :precision="4"/><strong>{{ form.currency }} {{ (line.quantity * line.unitPrice).toFixed(2) }}</strong><el-button :icon="Delete" text circle title="删除产品" @click="form.items.splice(index,1)"/></div></div><el-form-item label="报价说明"><el-input v-model="form.notes" type="textarea" :rows="3" placeholder="填写付款方式、包装要求或其他说明"/></el-form-item><div class="editor-total"><span>产品小计 {{ form.currency }} {{ subtotal.toFixed(2) }}</span><strong>含运费总计 {{ form.currency }} {{ total.toFixed(2) }}</strong></div><el-button type="primary" class="full-button" :loading="saving" @click="save">保存报价单</el-button></el-form></el-drawer>
  </section>
</template>
