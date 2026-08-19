<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, Check, Connection, DataAnalysis, Lock, Message, Tickets } from '@element-plus/icons-vue'

const workflow = [
  { label: '汇集询盘', detail: '统一承接客户需求与沟通上下文', signal: '需求已归档' },
  { label: '识别机会', detail: '提炼需求、风险与下一步行动', signal: 'AI 辅助判断' },
  { label: '协同报价', detail: '复用产品信息并推进内部审批', signal: '规则自动校验' },
  { label: '跟进成交', detail: '明确负责人、时限与客户反馈', signal: '节点持续提醒' },
  { label: '履约交付', detail: '持续跟踪订单进度与交付异常', signal: '风险及时暴露' }
]

const capabilities = [
  { icon: Message, title: '客户上下文', label: 'Customer context', text: '客户档案、联系人、询盘原文和跟进记录汇聚在同一业务视图。' },
  { icon: Tickets, title: '商业协同', label: 'Commercial workflow', text: '报价审批、订单推进、交付风险与责任人沿一条流程持续流转。' },
  { icon: DataAnalysis, title: 'AI 业务辅助', label: 'AI copilot', text: '依据企业资料分析需求、生成业务草稿，关键结果始终由人确认。' },
  { icon: Lock, title: '企业治理', label: 'Enterprise control', text: '租户隔离、角色权限、数据范围、敏感信息保护与完整操作审计。' }
]

const activeWorkflowStep = ref(1)
let workflowTimer: ReturnType<typeof setInterval> | undefined

function selectWorkflowStep(index: number) {
  activeWorkflowStep.value = index
}

function stopWorkflowRotation() {
  if (workflowTimer) clearInterval(workflowTimer)
  workflowTimer = undefined
}

function startWorkflowRotation() {
  stopWorkflowRotation()
  workflowTimer = setInterval(() => {
    activeWorkflowStep.value = (activeWorkflowStep.value + 1) % 4
  }, 2800)
}

onMounted(startWorkflowRotation)
onBeforeUnmount(stopWorkflowRotation)
</script>

<template>
  <main class="public-site">
    <header class="public-nav" aria-label="主导航">
      <RouterLink class="public-brand" to="/" aria-label="NexaFlow 首页">
        <span>NX</span>
        <div><strong>NexaFlow</strong><small>客户经营控制台</small></div>
      </RouterLink>
      <nav>
        <a href="#workflow">业务链路</a><a href="#capabilities">产品能力</a>
        <a href="#security">安全治理</a><a href="#pricing">套餐价格</a>
      </nav>
      <div class="public-nav-actions">
        <RouterLink class="public-signin" to="/login">登录</RouterLink>
        <RouterLink class="public-primary small" :to="{ path: '/login', query: { redirect: '/app' } }">
          开始使用<el-icon><ArrowRight /></el-icon>
        </RouterLink>
      </div>
    </header>

    <section class="public-hero" aria-labelledby="hero-title">
      <img src="/images/nexaflow-coastal-architecture.png" alt="白色海岸建筑与静谧水面" />
      <div class="public-hero-shade"></div>
      <div class="public-hero-layout">
        <div class="public-hero-content">
          <p class="public-kicker"><i></i>客户业务协同平台</p>
          <h1 id="hero-title">NexaFlow</h1>
          <p class="public-hero-lead"><span>把每一次客户需求</span><span>推进成可交付的业务结果</span></p>
          <p class="public-hero-copy">从询盘识别、报价协同到订单交付，团队共享完整上下文、明确责任人与下一步行动。</p>
          <div class="public-hero-actions">
            <RouterLink class="public-primary" :to="{ path: '/login', query: { redirect: '/app' } }">
              进入企业工作台<el-icon><ArrowRight /></el-icon>
            </RouterLink>
            <a class="public-secondary" href="#workflow">了解业务链路</a>
          </div>
          <ul class="public-assurances" aria-label="平台保障">
            <li><el-icon><Check /></el-icon>企业数据独立</li>
            <li><el-icon><Check /></el-icon>关键操作留痕</li>
            <li><el-icon><Check /></el-icon>AI 结果人工确认</li>
          </ul>
        </div>

        <aside class="hero-route" aria-label="业务推进状态示意" @mouseenter="stopWorkflowRotation" @mouseleave="startWorkflowRotation">
          <header><span>业务推进状态</span><b><i></i>持续协同</b></header>
          <ol>
            <li v-for="(item, index) in workflow.slice(0, 4)" :key="item.label" :class="{ active: index === activeWorkflowStep }">
              <button type="button" :aria-pressed="index === activeWorkflowStep" @click="selectWorkflowStep(index)" @focus="selectWorkflowStep(index); stopWorkflowRotation()" @blur="startWorkflowRotation">
                <span class="route-node"></span>
                <span class="route-copy"><small>{{ item.signal }}</small><strong>{{ item.label }}</strong></span>
                <em>{{ String(index + 1).padStart(2, '0') }}</em>
              </button>
            </li>
          </ol>
          <footer><span>每一步都有依据</span><strong>从需求到交付，全程可追溯</strong></footer>
        </aside>
      </div>

      <div class="hero-evidence" aria-label="平台价值">
        <div><span>一条链路</span><strong>客户信息不再散落</strong></div>
        <div><span>一个视图</span><strong>团队行动始终同步</strong></div>
        <div><span>一道边界</span><strong>数据与操作严格受控</strong></div>
      </div>
    </section>

    <section id="workflow" class="public-band public-workflow" aria-labelledby="workflow-title">
      <div class="public-section-head">
        <p>连续业务链路</p>
        <h2 id="workflow-title" class="split-title">
          <span>信息只录入一次</span>
          <span>后续动作自然发生</span>
        </h2>
        <span>每个环节保留客户上下文、负责人、处理期限和下一步动作，让团队清楚现在发生什么、接下来由谁处理。</span>
      </div>
      <ol class="workflow-line">
        <li v-for="(item, index) in workflow" :key="item.label">
          <b>{{ String(index + 1).padStart(2, '0') }}</b>
          <div><strong>{{ item.label }}</strong><span>{{ item.detail }}</span><small>{{ item.signal }}</small></div>
        </li>
      </ol>
    </section>

    <section id="capabilities" class="public-band public-capabilities" aria-labelledby="capability-title">
      <div class="public-section-head compact">
        <p>产品能力</p>
        <h2 id="capability-title" class="split-title">
          <span>围绕客户经营组织能力</span>
          <span>而不是堆叠功能入口</span>
        </h2>
      </div>
      <div class="capability-grid">
        <article v-for="(item, index) in capabilities" :key="item.title">
          <header><span>{{ String(index + 1).padStart(2, '0') }}</span><small>{{ item.label }}</small></header>
          <el-icon><component :is="item.icon" /></el-icon>
          <h3>{{ item.title }}</h3><p>{{ item.text }}</p>
        </article>
      </div>
    </section>

    <section id="security" class="public-band public-security" aria-labelledby="security-title">
      <div class="security-statement">
        <p>安全与治理</p>
        <h2 id="security-title" class="split-title">
          <span>企业数据有边界</span>
          <span>每次操作都有依据</span>
        </h2>
        <span>权限与数据范围由服务端执行。登录、查询、修改、导出和 AI 使用持续留痕，关键业务不依赖界面隐藏来保护。</span>
      </div>
      <div class="security-controls">
        <div><el-icon><Lock /></el-icon><strong>身份与会话</strong><span>受保护的工作台、短期访问凭证和可撤销会话</span><b>受控</b></div>
        <div><el-icon><Connection /></el-icon><strong>组织与权限</strong><span>角色权限、部门范围、本人数据与敏感字段保护</span><b>隔离</b></div>
        <div><el-icon><DataAnalysis /></el-icon><strong>经营可追溯</strong><span>关键业务流转、异常处理与操作记录持续留痕</span><b>可审计</b></div>
      </div>
    </section>

    <section id="pricing" class="public-band public-pricing" aria-labelledby="pricing-title">
      <div class="public-section-head">
        <p>透明套餐</p>
        <h2 id="pricing-title" class="split-title">
          <span>先跑通业务</span>
          <span>再扩大团队规模</span>
        </h2>
        <span>成员、客户和 AI 额度清楚可见。正式支付前明确展示订单金额与服务周期，使用规模始终可控。</span>
      </div>
      <div class="pricing-grid">
        <article>
          <header><p>试用版</p><span>验证业务流程</span></header>
          <strong>免费</strong><small>3 名成员 · 100 位客户 · 100 次 AI 额度</small>
          <RouterLink to="/login">创建企业<el-icon><ArrowRight /></el-icon></RouterLink>
        </article>
        <article class="featured">
          <header><p>专业版</p><span>适合成长团队</span></header>
          <strong><small>¥</small>899<small>/月</small></strong><small>20 名成员 · 10,000 位客户 · 3,000 次 AI 额度</small>
          <RouterLink :to="{ path: '/login', query: { redirect: '/app/governance' } }">开始使用<el-icon><ArrowRight /></el-icon></RouterLink>
        </article>
        <article>
          <header><p>企业版</p><span>复杂组织协作</span></header>
          <strong><small>¥</small>3,999<small>/月</small></strong><small>200 名成员 · 100,000 位客户 · 30,000 次 AI 额度</small>
          <RouterLink :to="{ path: '/login', query: { redirect: '/app/help' } }">联系支持<el-icon><ArrowRight /></el-icon></RouterLink>
        </article>
      </div>
    </section>

    <section class="public-close">
      <div><p>现在开始</p><h2><span>让团队从下一条询盘开始</span><span>沿着清晰的路径走向交付</span></h2></div>
      <RouterLink class="public-primary" :to="{ path: '/login', query: { redirect: '/app' } }">
        创建或登录企业账号<el-icon><ArrowRight /></el-icon>
      </RouterLink>
    </section>

    <footer class="public-footer">
      <div class="public-brand"><span>NX</span><div><strong>NexaFlow</strong><small>客户经营控制台</small></div></div>
      <p>客户协同，从询盘走向交付。</p>
      <nav><RouterLink to="/privacy">隐私政策</RouterLink><RouterLink to="/terms">服务条款</RouterLink></nav>
      <span>© {{ new Date().getFullYear() }} NexaFlow</span>
    </footer>
  </main>
</template>
