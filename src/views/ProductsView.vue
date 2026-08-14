<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, Edit, Plus, Search, Upload } from '@element-plus/icons-vue'
import { tradeApi, type BulkImportResult, type ProductView, type UpsertProductRequest } from '../api/trade'
import ImportResultDialog from '../components/ImportResultDialog.vue'
import { currencyOptions } from '../utils/presentation'
import { useAuthStore } from '../stores/auth'
import { hasPermission } from '../security/permissions'
import { downloadCsv, parseCsv } from '../utils/csv'

const auth = useAuthStore()

const products = ref<ProductView[]>([])
const keyword = ref('')
const dialog = ref(false)
const editingId = ref('')
const loading = ref(false)
const importInput = ref<HTMLInputElement>()
const importing = ref(false)
const importResult = ref<BulkImportResult>()
const importResultDialog = ref(false)
const form = ref<UpsertProductRequest>({ sku: '', name: '', specification: '', currency: 'USD', unitPrice: 0, moq: 1, active: true })
async function load() { loading.value = true; try { products.value = await tradeApi.products(keyword.value) } finally { loading.value = false } }
function create() { editingId.value = ''; form.value = { sku: '', name: '', specification: '', currency: 'USD', unitPrice: 0, moq: 1, active: true }; dialog.value = true }
function edit(item: ProductView) { editingId.value = item.id; form.value = { sku: item.sku, name: item.name, specification: item.specification, currency: item.currency, unitPrice: item.unitPrice, moq: item.moq, active: item.active }; dialog.value = true }
async function save() { if (!form.value.sku.trim() || !form.value.name.trim()) return ElMessage.warning('请填写产品编号和产品名称'); editingId.value ? await tradeApi.updateProduct(editingId.value, form.value) : await tradeApi.createProduct(form.value); dialog.value = false; await load(); ElMessage.success('产品资料已保存') }
async function remove(item: ProductView) { await ElMessageBox.confirm(`确认删除产品 ${item.name}？`, '删除产品', { type: 'warning' }); await tradeApi.deleteProduct(item.id); await load(); ElMessage.success('产品已删除') }
async function importProducts(event: Event) {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; input.value = ''; if (!file) return
  if (file.size > 2 * 1024 * 1024) return ElMessage.warning('CSV 文件不能超过 2MB')
  importing.value = true
  try {
    const rows = parseCsv(await file.text()).map(row => ({ sku: row.sku || row['产品编号'], name: row.name || row['产品名称'], specification: row.specification || row['规格'] || '', currency: (row.currency || row['币种'] || 'USD').toUpperCase(), unitPrice: Number(row.unitprice || row.unit_price || row['单价'] || 0), moq: Number(row.moq || row['起订量'] || 1), active: !['false', '0', '停用'].includes((row.active || row['状态'] || 'true').toLowerCase()) }))
    if (rows.length > 500) throw new Error('单次最多导入 500 条产品')
    if (rows.some(row => !Number.isFinite(row.unitPrice) || !Number.isInteger(row.moq))) throw new Error('产品单价必须是数字，起订量必须是整数')
    const result = await tradeApi.importProducts(rows); await load()
    importResult.value = result; importResultDialog.value = true
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '产品导入失败') }
  finally { importing.value = false }
}
async function exportProducts() {
  try {
    const rows = await tradeApi.exportProducts()
    downloadCsv('nexaflow-products.csv', [
      { key: 'sku', label: '产品编号' }, { key: 'name', label: '产品名称' },
      { key: 'specification', label: '规格' }, { key: 'currency', label: '币种' },
      { key: 'unitPrice', label: '单价' }, { key: 'moq', label: '起订量' },
      { key: 'active', label: '在售状态' }
    ], rows)
    ElMessage.success(`已导出 ${rows.length} 条产品数据`)
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '产品导出失败') }
}
onMounted(load)
</script>

<template>
  <section class="page-shell">
    <header class="page-head"><div><p class="section-kicker">标准商品数据</p><h1>产品目录</h1><p>统一管理产品编号、规格、价格和起订量，报价时直接带入。</p></div><div class="action-row"><el-button v-if="hasPermission(auth.role, 'data:export')" :icon="Download" @click="exportProducts">导出数据</el-button><template v-if="hasPermission(auth.role, 'product:write')"><input ref="importInput" class="visually-hidden" type="file" accept=".csv,text/csv" @change="importProducts"><el-button :icon="Upload" :loading="importing" @click="importInput?.click()">导入 CSV</el-button><el-button type="primary" :icon="Plus" @click="create">新增产品</el-button></template></div></header>
    <section class="surface table-surface" v-loading="loading">
      <div class="table-toolbar"><el-input v-model="keyword" :prefix-icon="Search" placeholder="搜索产品编号或名称" clearable @keyup.enter="load"/><el-button @click="load">搜索</el-button></div>
      <el-table :data="products" row-key="id">
        <el-table-column prop="sku" label="产品编号" min-width="130"/>
        <el-table-column prop="name" label="产品名称" min-width="180"/>
        <el-table-column prop="specification" label="规格" min-width="220" show-overflow-tooltip/>
        <el-table-column label="参考价格" width="150"><template #default="{ row }"><strong class="money">{{ row.currency }} {{ Number(row.unitPrice).toFixed(2) }}</strong></template></el-table-column>
        <el-table-column prop="moq" label="起订量" width="100"/>
        <el-table-column label="状态" width="100"><template #default="{ row }"><span class="state-chip" :class="{ muted: !row.active }">{{ row.active ? '在售' : '停用' }}</span></template></el-table-column>
        <el-table-column v-if="hasPermission(auth.role, 'product:write')" label="操作" width="120" fixed="right"><template #default="{ row }"><el-button :icon="Edit" text circle title="编辑" @click="edit(row)"/><el-button v-if="hasPermission(auth.role, 'product:delete')" :icon="Delete" text circle title="删除" @click="remove(row)"/></template></el-table-column>
      </el-table>
      <div v-if="!products.length" class="empty-compact">建立第一条产品资料后，即可在报价单中直接选择。</div>
    </section>
    <el-dialog v-model="dialog" :title="editingId ? '编辑产品' : '新增产品'" width="620px"><el-form label-position="top"><div class="form-grid"><el-form-item label="产品编号（SKU）"><el-input v-model="form.sku" placeholder="企业内部使用的产品编号"/></el-form-item><el-form-item label="产品名称"><el-input v-model="form.name"/></el-form-item><el-form-item label="报价币种"><el-select v-model="form.currency"><el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value"/></el-select></el-form-item><el-form-item label="参考单价"><el-input-number v-model="form.unitPrice" :min="0" :precision="4"/></el-form-item><el-form-item label="最小起订量"><el-input-number v-model="form.moq" :min="1"/></el-form-item><el-form-item label="销售状态"><el-switch v-model="form.active" active-text="在售" inactive-text="停用"/></el-form-item></div><el-form-item label="规格说明"><el-input v-model="form.specification" type="textarea" :rows="3"/></el-form-item></el-form><template #footer><el-button @click="dialog=false">取消</el-button><el-button type="primary" @click="save">保存产品</el-button></template></el-dialog>
    <ImportResultDialog v-model="importResultDialog" :result="importResult" resource-label="产品资料"/>
  </section>
</template>
