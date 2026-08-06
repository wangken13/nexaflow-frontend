<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Avatar, Bell, CircleCheck, Cpu, Document, Plus, Promotion, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { request } from '../api/http'

interface Customer {
  id: string
  name: string
  country: string
  tag: string
}

interface InquiryAnalysis {
  intent: string
  urgency: string
  nextActions: string[]
  analysisText: string
  replyDraft: string
  quotationDraft: string
}

interface Task {
  id: string
  title: string
  priority: string
  status: string
  dueAt: string
}

const auth = useAuthStore()
const customers = ref<Customer[]>([])
const tasks = ref<Task[]>([])
const analysis = ref<InquiryAnalysis | null>(null)
const loadingAi = ref(false)
const inquiry = ref({
  customerId: 'cus-001',
  subject: 'Need quotation',
  content: 'Urgent quote for 500 ceramic mugs with custom logo, FOB Shanghai.'
})

async function loadData() {
  customers.value = await request<Customer[]>('/customer')
  tasks.value = await request<Task[]>('/task')
}

async function submitInquiry() {
  loadingAi.value = true
  try {
    await request('/inquiry', { method: 'post', data: inquiry.value })
    analysis.value = await request<InquiryAnalysis>('/ai/analyze-inquiry', {
      method: 'post',
      data: { content: inquiry.value.content }
    })
    await request('/task', {
      method: 'post',
      data: {
        title: `跟进 ${analysis.value.intent}`,
        priority: analysis.value.urgency,
        dueAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      }
    })
    await loadData()
    ElMessage.success('询盘已分析并生成跟进任务')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '处理失败')
  } finally {
    loadingAi.value = false
  }
}

function logout() {
  auth.logout()
  location.href = '/login'
}

onMounted(loadData)
</script>

<template>
  <main class="workspace">
    <aside class="rail">
      <div class="brand">T</div>
      <button class="rail-button active" title="工作流"><Cpu /></button>
      <button class="rail-button" title="客户"><Avatar /></button>
      <button class="rail-button" title="报价"><Document /></button>
      <button class="rail-button" title="提醒"><Bell /></button>
      <button class="rail-button bottom" title="退出" @click="logout"><SwitchButton /></button>
    </aside>

    <section class="main-grid">
      <header class="topbar">
        <div>
          <p class="eyebrow">Demo 外贸团队</p>
          <h1>今日跟单指挥台</h1>
        </div>
        <el-button type="primary" :icon="Plus">新客户</el-button>
      </header>

      <section class="metric-strip">
        <div class="metric"><strong>{{ customers.length }}</strong><span>客户</span></div>
        <div class="metric amber"><strong>3</strong><span>新询盘</span></div>
        <div class="metric green"><strong>{{ tasks.length }}</strong><span>待跟进</span></div>
        <div class="metric red"><strong>1</strong><span>风险订单</span></div>
      </section>

      <section class="workbench">
        <div class="panel inquiry-panel">
          <div class="panel-title">
            <h2>询盘分析</h2>
            <el-button type="primary" :icon="Promotion" :loading="loadingAi" @click="submitInquiry">分析并建任务</el-button>
          </div>
          <el-select v-model="inquiry.customerId" size="large">
            <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id" />
          </el-select>
          <el-input v-model="inquiry.subject" size="large" />
          <el-input v-model="inquiry.content" type="textarea" :rows="8" />
        </div>

        <div class="panel result-panel">
          <div class="panel-title">
            <h2>AI 输出</h2>
            <span v-if="analysis" class="status">{{ analysis.urgency }}</span>
          </div>
          <template v-if="analysis">
            <div class="analysis-block">
              <label>意图</label>
              <strong>{{ analysis.intent }}</strong>
            </div>
            <div class="analysis-block">
              <label>建议动作</label>
              <ul>
                <li v-for="action in analysis.nextActions" :key="action">{{ action }}</li>
              </ul>
            </div>
            <div class="draft">
              <label>回复草稿</label>
              <p>{{ analysis.replyDraft }}</p>
            </div>
            <div class="draft">
              <label>报价草稿</label>
              <p>{{ analysis.quotationDraft }}</p>
            </div>
          </template>
          <div v-else class="empty-state">录入询盘后，这里会出现 AI 分析、回复草稿和报价建议。</div>
        </div>
      </section>

      <section class="lower-grid">
        <div class="panel">
          <div class="panel-title"><h2>客户池</h2><Avatar /></div>
          <div v-for="customer in customers" :key="customer.id" class="row-item">
            <span>{{ customer.name }}</span>
            <small>{{ customer.country }} / {{ customer.tag }}</small>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title"><h2>待办提醒</h2><CircleCheck /></div>
          <div v-for="task in tasks" :key="task.id" class="row-item">
            <span>{{ task.title }}</span>
            <small>{{ task.priority }} / {{ task.status }}</small>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
