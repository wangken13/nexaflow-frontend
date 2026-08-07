<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, CircleCheck, Cpu, Document, Promotion, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { request } from '../api/http'

interface InquiryAnalysis {
  intent: string
  urgency: string
  nextActions: string[]
  analysisText: string
  replyDraft: string
  quotationDraft: string
}

const auth = useAuthStore()
const analysis = ref<InquiryAnalysis | null>(null)
const loadingAi = ref(false)
const inquiry = ref({
  customerId: 'private-customer',
  subject: '',
  content: ''
})

async function submitInquiry() {
  if (!inquiry.value.content.trim()) {
    ElMessage.warning('请输入询盘内容')
    return
  }

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
    ElMessage.success('已生成处理方案')
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
</script>

<template>
  <main class="workspace premium-workspace">
    <aside class="rail">
      <div class="brand">T</div>
      <button class="rail-button active" title="智能处理"><Cpu /></button>
      <button class="rail-button" title="报价文档"><Document /></button>
      <button class="rail-button" title="提醒"><Bell /></button>
      <button class="rail-button" title="完成"><CircleCheck /></button>
      <button class="rail-button bottom" title="退出" @click="logout"><SwitchButton /></button>
    </aside>

    <section class="main-grid">
      <header class="topbar premium-topbar">
        <div>
          <p class="eyebrow">Confidential trade desk</p>
          <h1>外贸智能跟单中枢</h1>
        </div>
        <span class="privacy-mark">Private mode</span>
      </header>

      <section class="flow-strip" aria-label="处理流程">
        <div class="flow-step active"><span>询盘接收</span></div>
        <div class="flow-step"><span>智能研判</span></div>
        <div class="flow-step"><span>草稿生成</span></div>
        <div class="flow-step"><span>跟进归档</span></div>
      </section>

      <section class="workbench premium-bench">
        <div class="panel inquiry-panel command-panel">
          <div class="panel-title">
            <h2>询盘处理</h2>
            <el-button type="primary" :icon="Promotion" :loading="loadingAi" @click="submitInquiry">生成方案</el-button>
          </div>
          <el-input v-model="inquiry.subject" size="large" placeholder="主题" />
          <el-input
            v-model="inquiry.content"
            type="textarea"
            :rows="12"
            placeholder="粘贴需要处理的询盘内容"
          />
        </div>

        <div class="panel result-panel intelligence-panel">
          <div class="panel-title">
            <h2>智能方案</h2>
            <span v-if="analysis" class="status">{{ analysis.urgency }}</span>
          </div>
          <template v-if="analysis">
            <div class="analysis-block">
              <label>业务判断</label>
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
          <div v-else class="empty-state">处理结果将在此生成。界面不会展示客户名单、业务数量或内部状态。</div>
        </div>
      </section>
    </section>
  </main>
</template>
