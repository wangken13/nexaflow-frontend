<script setup lang="ts">
import { ArrowRight, Check, Connection, DataAnalysis, Lock, Message, Tickets } from '@element-plus/icons-vue'

const workflow = [
  { label: '汇集询盘', detail: '统一承接客户需求与沟通上下文', signal: '需求已归档' },
  { label: '识别机会', detail: '提炼需求、风险与下一步行动', signal: 'AI 辅助判断' },
  { label: '协同报价', detail: '复用产品信息并推进内部审批', signal: '规则自动校验' },
  { label: '跟进成交', detail: '明确负责人、时限与客户反馈', signal: '节点持续提醒' },
  { label: '履约交付', detail: '持续跟踪订单进度与交付异常', signal: '风险及时暴露' }
]

const capabilities = [
  { icon: Message, title: '完整客户上下文', text: '客户档案、联系人、询盘原文和跟进记录汇聚在同一视图，团队无需反复确认信息来源。' },
  { icon: Tickets, title: '连续商业协同', text: '报价审批、订单推进、交付风险与负责人沿一条业务路径持续流转。' },
  { icon: DataAnalysis, title: '可控 AI 辅助', text: '依据企业资料识别需求、生成业务草稿，关键判断始终由团队确认。' },
  { icon: Lock, title: '清晰数据边界', text: '租户隔离、角色权限、数据范围、敏感信息保护和操作审计共同生效。' }
]
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
      <div class="public-hero-wash"></div>
      <div class="public-hero-layout">
        <div class="public-hero-content">
          <h1 id="hero-title"><span>NexaFlow</span><span>让客户经营持续发生</span></h1>
          <p>从询盘、报价到交付，团队在同一条业务路径上共享上下文、明确责任人与下一步行动。</p>
          <div class="public-hero-actions">
            <RouterLink class="public-primary" :to="{ path: '/login', query: { redirect: '/app' } }">
              进入企业工作台<el-icon><ArrowRight /></el-icon>
            </RouterLink>
            <a class="public-secondary" href="#workflow">查看业务如何推进</a>
          </div>
          <ul class="public-assurances" aria-label="平台保障">
            <li><el-icon><Check /></el-icon>企业数据独立</li>
            <li><el-icon><Check /></el-icon>关键操作留痕</li>
            <li><el-icon><Check /></el-icon>AI 结果人工确认</li>
          </ul>
        </div>
      </div>
      <div class="hero-route" aria-label="业务推进路径">
        <template v-for="(item, index) in workflow" :key="item.label">
          <span>{{ item.label }}</span>
          <el-icon v-if="index < workflow.length - 1"><ArrowRight /></el-icon>
        </template>
      </div>
    </section>

    <section id="workflow" class="public-band public-workflow" aria-labelledby="workflow-title">
      <div class="public-section-head workflow-head">
        <h2 id="workflow-title">信息只录入一次<br />后续动作自然发生</h2>
        <p>每个环节都保留客户上下文、负责人、处理期限和下一步动作。团队知道现在发生什么，也知道接下来该由谁处理。</p>
      </div>
      <ol class="workflow-line">
        <li v-for="(item, index) in workflow" :key="item.label">
          <div><strong>{{ item.label }}</strong><span>{{ item.detail }}</span></div>
          <small>{{ item.signal }}</small>
          <el-icon v-if="index < workflow.length - 1"><ArrowRight /></el-icon>
        </li>
      </ol>
    </section>

    <section id="capabilities" class="public-band public-capabilities" aria-labelledby="capability-title">
      <div class="public-section-head">
        <h2 id="capability-title">围绕客户经营组织能力<br />而不是堆叠功能入口</h2>
        <p>客户信息进入系统后，后续的分析、报价、订单、任务与治理都在同一套业务语境中发生。</p>
      </div>
      <div class="capability-grid">
        <article v-for="item in capabilities" :key="item.title">
          <el-icon><component :is="item.icon" /></el-icon>
          <div><h3>{{ item.title }}</h3><p>{{ item.text }}</p></div>
        </article>
      </div>
    </section>

    <section id="security" class="public-band public-security" aria-labelledby="security-title">
      <div class="security-statement">
        <h2 id="security-title">企业数据有边界<br />每次操作都有依据</h2>
        <p>权限与数据范围由服务端执行。登录、查询、修改、导出和 AI 使用持续留痕，关键业务不依赖界面隐藏来保护。</p>
      </div>
      <div class="security-controls">
        <div><el-icon><Lock /></el-icon><strong>身份与会话</strong><span>受保护的工作台、短期访问凭证和可撤销会话</span><b>受控</b></div>
        <div><el-icon><Connection /></el-icon><strong>组织与权限</strong><span>角色权限、部门范围、本人数据与敏感字段保护</span><b>隔离</b></div>
        <div><el-icon><DataAnalysis /></el-icon><strong>经营可追溯</strong><span>关键业务流转、异常处理与操作记录持续留痕</span><b>可审计</b></div>
      </div>
    </section>

    <section id="pricing" class="public-band public-pricing" aria-labelledby="pricing-title">
      <div class="public-section-head pricing-head">
        <h2 id="pricing-title">先跑通业务<br />再扩大团队规模</h2>
        <p>成员、客户和 AI 用量清楚可见。正式支付前明确展示订单金额与服务周期，使用规模始终可控。</p>
      </div>
      <div class="pricing-grid">
        <article>
          <header><p>试用版</p><span>验证业务流程</span></header>
          <strong>免费</strong><small>适合完成企业开通与核心流程体验</small>
          <RouterLink to="/login">创建企业<el-icon><ArrowRight /></el-icon></RouterLink>
        </article>
        <article class="featured">
          <header><p>专业版</p><span>适合成长团队</span></header>
          <strong><small>¥</small>9.9<small>/月</small></strong><small>适合持续处理客户、询盘与报价协同</small>
          <RouterLink :to="{ path: '/login', query: { redirect: '/app/governance' } }">开始使用<el-icon><ArrowRight /></el-icon></RouterLink>
        </article>
        <article>
          <header><p>企业版</p><span>复杂组织协作</span></header>
          <strong><small>¥</small>19.9<small>/月</small></strong><small>适合多成员、复杂权限与更高业务用量</small>
          <RouterLink :to="{ path: '/login', query: { redirect: '/app/help' } }">联系支持<el-icon><ArrowRight /></el-icon></RouterLink>
        </article>
      </div>
    </section>

    <section class="public-close">
      <div><h2>从下一条询盘开始<br />让每次协作都有下一步</h2></div>
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
