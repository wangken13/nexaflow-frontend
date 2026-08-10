<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { tradeApi, type CustomerView, type OrderView, type ProductView } from '../api/trade'
import { formatDate, orderStatusLabels } from '../utils/presentation'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../security/permissions'

const auth = useAuthStore()

const orders = ref<OrderView[]>([])
const customers = ref<CustomerView[]>([])
const products = ref<ProductView[]>([])
const dialog = ref(false)
const form = ref({ customerId: '', productId: '', deliveryDate: '' })
const statusLabels = orderStatusLabels
const nextActions: Record<string, Array<{ value: string; label: string }>> = {
  RISK_REVIEW: [{ value: 'CONFIRMED', label: '确认接单' }, { value: 'CANCELLED', label: '取消订单' }],
  CONFIRMED: [{ value: 'PRODUCING', label: '开始生产' }, { value: 'CANCELLED', label: '取消订单' }],
  PRODUCING: [{ value: 'READY_TO_SHIP', label: '生产完成' }, { value: 'CANCELLED', label: '取消订单' }],
  READY_TO_SHIP: [{ value: 'SHIPPED', label: '确认发运' }, { value: 'CANCELLED', label: '取消订单' }],
  SHIPPED: [{ value: 'DELIVERED', label: '确认交付' }]
}
async function load() { [orders.value, customers.value, products.value] = await Promise.all([tradeApi.orders(), tradeApi.customers(), tradeApi.products()]) }
async function save() { if (!form.value.customerId || !form.value.productId || !form.value.deliveryDate) return ElMessage.warning('请选择客户、产品和交付日期'); try { await tradeApi.createOrder(form.value); dialog.value = false; form.value = { customerId: '', productId: '', deliveryDate: '' }; await load(); ElMessage.success('订单已创建') } catch (error) { ElMessage.error(error instanceof Error ? error.message : '订单创建失败') } }
async function changeStatus(order: OrderView, status: string) { try { await tradeApi.updateOrderStatus(order.id, status); await load(); ElMessage.success('履约状态已更新') } catch (error) { ElMessage.error(error instanceof Error ? error.message : '状态更新失败') } }
onMounted(load)
</script>
<template><section class="page-shell"><header class="page-head"><div><p class="section-kicker">履约与交付风险</p><h1>订单交付</h1><p>集中查看交期和风险状态，优先处理可能延误的订单。</p></div><el-button v-if="hasPermission(auth.role, 'order:create')" type="primary" :icon="Plus" @click="dialog=true">新建订单</el-button></header><section class="surface table-surface"><el-table :data="orders" row-key="id"><el-table-column label="客户" min-width="180"><template #default="{row}"><div class="reference-cell"><span>{{ row.customerName }}</span><small v-if="!row.customerId">历史数据待关联</small></div></template></el-table-column><el-table-column label="产品" min-width="200"><template #default="{row}"><div class="reference-cell"><span>{{ row.productName }}</span><small v-if="!row.productId">历史数据待关联</small></div></template></el-table-column><el-table-column label="计划交付日期" width="170"><template #default="{row}">{{ formatDate(row.deliveryDate) }}</template></el-table-column><el-table-column label="当前进度" width="150"><template #default="{row}"><span class="state-chip">{{ statusLabels[row.status] || '处理中' }}</span></template></el-table-column><el-table-column label="交付风险" width="120"><template #default="{row}"><span class="state-chip" :class="{ danger: row.risk, muted: !row.risk }">{{ row.risk ? '需要处理' : '暂无风险' }}</span></template></el-table-column><el-table-column v-if="hasPermission(auth.role, 'order:fulfill')" label="可执行操作" min-width="210" align="right"><template #default="{row}"><div class="order-actions"><el-button v-for="action in nextActions[row.status] || []" :key="action.value" text :class="{ 'danger-action': action.value === 'CANCELLED' }" @click="changeStatus(row, action.value)">{{ action.label }}</el-button><span v-if="!(nextActions[row.status] || []).length" class="done-label">流程已结束</span></div></template></el-table-column></el-table><div v-if="!orders.length" class="empty-compact">暂无订单</div></section><el-dialog v-model="dialog" title="新建订单" width="520px"><el-form label-position="top"><el-form-item label="下单客户"><el-select v-model="form.customerId" filterable placeholder="从客户中心选择"><el-option v-for="item in customers" :key="item.id" :label="`${item.name} · ${item.country || '未设置地区'}`" :value="item.id"/></el-select></el-form-item><el-form-item label="订购产品"><el-select v-model="form.productId" filterable placeholder="从产品目录选择"><el-option v-for="item in products.filter(product => product.active)" :key="item.id" :label="`${item.sku} · ${item.name} · ${item.currency} ${item.unitPrice}`" :value="item.id"/></el-select></el-form-item><el-form-item label="计划交付日期"><el-date-picker v-model="form.deliveryDate" value-format="YYYY-MM-DD" type="date" placeholder="选择交付日期"/></el-form-item></el-form><template #footer><el-button @click="dialog=false">取消</el-button><el-button type="primary" @click="save">创建订单</el-button></template></el-dialog></section></template>
