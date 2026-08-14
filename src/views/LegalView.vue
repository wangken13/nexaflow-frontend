<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const privacy = computed(() => route.name === 'privacy')
</script>

<template>
  <main class="legal-page">
    <header>
      <RouterLink class="public-brand" to="/"><span>NX</span><strong>NexaFlow</strong></RouterLink>
      <RouterLink to="/">返回首页</RouterLink>
    </header>
    <article v-if="privacy">
      <p class="public-kicker">数据与隐私</p>
      <h1>隐私政策</h1>
      <p class="legal-updated">更新日期：2026 年 8 月 14 日</p>
      <h2>我们处理哪些数据</h2>
      <p>为提供客户协同服务，系统会处理企业账号、客户联系人、询盘、报价、订单、任务、文件及必要的操作日志。短信、邮箱与 AI 服务仅在企业管理员配置并主动使用时调用。</p>
      <h2>处理目的与边界</h2>
      <p>数据用于身份认证、业务协作、风险控制、故障定位和企业授权的 AI 辅助。不同租户的数据按租户标识隔离，服务端执行角色、部门、数据范围与敏感字段权限。</p>
      <h2>保存与删除</h2>
      <p>业务数据在企业订阅和法定留存期内保存。企业管理员可通过支持工单申请导出、迁移、注销或删除；执行前会进行身份复核并记录审计轨迹。</p>
      <h2>第三方处理者</h2>
      <p>企业可按需配置对象存储、短信、邮箱和模型服务。系统只发送完成对应任务所需的最少数据，密钥由部署环境管理，不展示在普通用户界面。</p>
      <h2>安全措施</h2>
      <p>平台使用 HTTPS、安全 Cookie、短期访问令牌、服务端权限校验、请求限流、操作审计、备份校验和故障探针。任何系统都无法承诺绝对安全，我们会持续修复风险并提供事件响应。</p>
    </article>
    <article v-else>
      <p class="public-kicker">服务约定</p>
      <h1>服务条款</h1>
      <p class="legal-updated">更新日期：2026 年 8 月 14 日</p>
      <h2>服务范围</h2>
      <p>NexaFlow 提供客户、询盘、报价、审批、订单、任务、知识库、集成与企业治理能力。外部短信、邮箱、支付和模型服务的可用性同时受对应供应商约束。</p>
      <h2>账号与授权</h2>
      <p>企业管理员负责成员授权、数据来源合法性和账号安全。用户不得绕过权限、批量攻击接口、上传违法内容或将平台用于未经授权的数据处理。</p>
      <h2>AI 使用说明</h2>
      <p>AI 输出为辅助草稿，不构成最终报价、交期或法律承诺。系统会优先引用企业知识资料并在证据不足时提示人工确认，最终业务决定由企业授权人员作出。</p>
      <h2>订阅、退款与发票</h2>
      <p>套餐额度、周期和金额以结算订单为准。支付、退款和发票请求会保存处理状态；尚未配置正式支付渠道的环境不会伪造支付成功。</p>
      <h2>可用性与支持</h2>
      <p>平台提供健康检查、日志、备份恢复和支持工单。具体 SLA、响应时间、数据迁移及培训范围以企业合同为准，试用环境不等同于正式生产 SLA。</p>
    </article>
  </main>
</template>
