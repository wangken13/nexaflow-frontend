<script setup lang="ts">
import { ArrowRight, Check, Connection, DataAnalysis, Lock, Message, Tickets } from '@element-plus/icons-vue'

const workflow = [
  { label: '汇集询盘', detail: '统一承接客户需求与沟通上下文' },
  { label: '识别机会', detail: '提炼需求、风险与下一步行动' },
  { label: '协同报价', detail: '复用产品信息并推进内部审批' },
  { label: '跟进成交', detail: '明确负责人、时限与客户反馈' },
  { label: '履约交付', detail: '持续跟踪订单进度与交付异常' }
]

const capabilities = [
  { icon: Message, title: '客户与询盘', text: '客户档案、联系人、询盘原文和跟进记录保持在同一业务上下文中。' },
  { icon: Tickets, title: '报价与交付', text: '报价审批、订单推进、交付风险与责任人形成连续流程。' },
  { icon: DataAnalysis, title: 'AI 业务辅助', text: '基于企业资料分析需求、生成草稿，并保留人工确认环节。' },
  { icon: Lock, title: '企业级治理', text: '租户隔离、角色权限、数据范围、敏感信息保护与操作审计。' }
]
</script>

<template>
  <main class="public-site">
    <header class="public-nav" aria-label="主导航">
      <RouterLink class="public-brand" to="/" aria-label="NexaFlow 首页">
        <span>NX</span>
        <strong>NexaFlow</strong>
      </RouterLink>
      <nav>
        <a href="#workflow">业务流程</a>
        <a href="#capabilities">产品能力</a>
        <a href="#security">安全治理</a>
        <a href="#pricing">套餐价格</a>
      </nav>
      <div class="public-nav-actions">
        <RouterLink class="public-signin" to="/login">登录</RouterLink>
        <RouterLink class="public-primary small" :to="{ path: '/login', query: { redirect: '/app' } }">
          开始使用<el-icon><ArrowRight /></el-icon>
        </RouterLink>
      </div>
    </header>

    <section class="public-hero" aria-labelledby="hero-title">
      <img src="/images/trade-port-login.png" alt="港口货运与跨区域业务协作场景" />
      <div class="public-hero-shade"></div>
      <div class="public-hero-content">
        <p class="public-kicker">客户业务协同平台</p>
        <h1 id="hero-title">NexaFlow</h1>
        <p class="public-hero-lead">让询盘、报价、跟进与交付共享同一条清晰的业务链路。</p>
        <div class="public-hero-actions">
          <RouterLink class="public-primary" :to="{ path: '/login', query: { redirect: '/app' } }">
            进入企业工作台<el-icon><ArrowRight /></el-icon>
          </RouterLink>
          <a class="public-secondary" href="#workflow">查看业务流程</a>
        </div>
        <ul class="public-assurances" aria-label="平台保障">
          <li><el-icon><Check /></el-icon>企业数据独立</li>
          <li><el-icon><Check /></el-icon>关键操作留痕</li>
          <li><el-icon><Check /></el-icon>AI 结果人工确认</li>
        </ul>
      </div>
      <div class="public-flow-preview" aria-label="NexaFlow 业务链路概览">
        <span>客户需求</span><i></i><span>机会分析</span><i></i><span>报价协同</span><i></i><span>订单交付</span>
      </div>
    </section>

    <section id="workflow" class="public-band public-workflow" aria-labelledby="workflow-title">
      <div class="public-section-head">
        <p>连续业务链路</p>
        <h2 id="workflow-title">信息只录入一次，团队沿着同一条流程推进</h2>
        <span>每个环节都保留负责人、处理期限、客户上下文与下一步动作。</span>
      </div>
      <ol class="workflow-line">
        <li v-for="(item, index) in workflow" :key="item.label">
          <b>{{ String(index + 1).padStart(2, '0') }}</b>
          <div><strong>{{ item.label }}</strong><span>{{ item.detail }}</span></div>
        </li>
      </ol>
    </section>

    <section id="capabilities" class="public-band public-capabilities" aria-labelledby="capability-title">
      <div class="public-section-head compact">
        <p>核心能力</p>
        <h2 id="capability-title">面向客户经营，而不是堆叠功能入口</h2>
      </div>
      <div class="capability-grid">
        <article v-for="item in capabilities" :key="item.title">
          <el-icon><component :is="item.icon" /></el-icon>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </div>
    </section>

    <section id="security" class="public-band public-security" aria-labelledby="security-title">
      <div class="security-statement">
        <p>安全与治理</p>
        <h2 id="security-title">企业数据有边界，团队操作有依据</h2>
        <span>权限和数据范围由服务端执行，避免只靠界面隐藏操作。登录、查询、修改、导出与 AI 使用均可审计。</span>
      </div>
      <div class="security-controls">
        <div><el-icon><Lock /></el-icon><strong>身份与会话</strong><span>受保护的工作台、短期访问凭证和可撤销会话</span></div>
        <div><el-icon><Connection /></el-icon><strong>组织与权限</strong><span>角色权限、部门范围、本人数据与敏感字段保护</span></div>
        <div><el-icon><DataAnalysis /></el-icon><strong>经营可追溯</strong><span>关键业务流转、异常处理与操作记录持续留痕</span></div>
      </div>
    </section>

    <section id="pricing" class="public-band public-pricing" aria-labelledby="pricing-title">
      <div class="public-section-head compact">
        <p>透明套餐</p>
        <h2 id="pricing-title">从小团队试用，到企业规模化协作</h2>
        <span>额度与工作台中的订阅治理保持一致，正式支付前会明确展示订单金额与服务周期。</span>
      </div>
      <div class="pricing-grid">
        <article>
          <p>试用版</p><strong>免费</strong><span>3 名成员 · 100 位客户 · 100 次 AI 额度</span>
          <RouterLink to="/login">创建企业</RouterLink>
        </article>
        <article class="featured">
          <p>专业版</p><strong><small>¥</small>899<small>/月</small></strong><span>20 名成员 · 10,000 位客户 · 3,000 次 AI 额度</span>
          <RouterLink :to="{ path: '/login', query: { redirect: '/app/governance' } }">开始使用</RouterLink>
        </article>
        <article>
          <p>企业版</p><strong><small>¥</small>3,999<small>/月</small></strong><span>200 名成员 · 100,000 位客户 · 30,000 次 AI 额度</span>
          <RouterLink :to="{ path: '/login', query: { redirect: '/app/help' } }">联系支持</RouterLink>
        </article>
      </div>
    </section>

    <section class="public-close">
      <div><p>准备开始</p><h2>进入 NexaFlow，建立团队的客户协同流程</h2></div>
      <RouterLink class="public-primary" :to="{ path: '/login', query: { redirect: '/app' } }">
        创建或登录企业账号<el-icon><ArrowRight /></el-icon>
      </RouterLink>
    </section>

    <footer class="public-footer">
      <div class="public-brand"><span>NX</span><strong>NexaFlow</strong></div>
      <p>客户协同，从询盘走向交付。</p>
      <nav><RouterLink to="/privacy">隐私政策</RouterLink><RouterLink to="/terms">服务条款</RouterLink></nav>
      <span>© {{ new Date().getFullYear() }} NexaFlow</span>
    </footer>
  </main>
</template>
