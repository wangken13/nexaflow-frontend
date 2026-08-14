<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import type { BulkImportResult } from '../api/trade'
import { downloadCsv } from '../utils/csv'

const props = defineProps<{ modelValue: boolean; result?: BulkImportResult; resourceLabel: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function downloadErrors() {
  if (!props.result?.errors.length) return
  downloadCsv(`nexaflow-${props.result.jobId || 'import'}-errors.csv`, [
    { key: 'message', label: '失败原因' }
  ], props.result.errors.map(message => ({ message })))
}
</script>

<template>
  <el-dialog :model-value="modelValue" title="导入结果" width="600px" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="result" class="import-result">
      <div class="import-result-summary"><div><span>接收</span><strong>{{ result.received }}</strong></div><div><span>成功</span><strong>{{ result.imported }}</strong></div><div><span>跳过</span><strong>{{ result.skipped }}</strong></div></div>
      <el-alert v-if="!result.skipped" :title="`${resourceLabel}全部导入成功`" type="success" :closable="false"/>
      <template v-else><el-alert :title="`${result.skipped} 条数据未导入，请修正后重新提交`" type="warning" :closable="false"/><div class="import-error-list"><p v-for="(error, index) in result.errors" :key="index">{{ error }}</p></div></template>
      <small v-if="result.jobId">导入任务：{{ result.jobId }}</small>
    </div>
    <template #footer><el-button v-if="result?.errors.length" :icon="Download" @click="downloadErrors">下载错误报告</el-button><el-button type="primary" @click="emit('update:modelValue', false)">完成</el-button></template>
  </el-dialog>
</template>
