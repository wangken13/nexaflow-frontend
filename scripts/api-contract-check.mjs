import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(resolve(root, 'src/api/trade.ts'), 'utf8')

const requiredEndpoints = [
  '/tenant/profile',
  '/tenant/members',
  '/tenant/departments',
  '/tenant/audit-logs',
  '/tenant/import-jobs',
  '/tenant/knowledge',
  '/tenant/channels',
  '/tenant/subscription',
  '/quotation/approval-rules',
  '/task/daily-report',
  '/customer',
  '/product',
  '/inquiry',
  '/inquiry/channel-credentials',
  '/inquiry/email-mailboxes',
  '/inquiry/channel-credentials/invocations',
  '/ai/analyze-inquiry',
  '/quotation',
  '/order',
  '/customer/export',
  '/product/export',
  '/order/export',
  '/task',
  '/notification',
  '/notification/tickets',
  '/tenant/onboarding',
  '/tenant/billing/plans',
  '/tenant/billing/orders'
]

const missing = requiredEndpoints.filter((endpoint) => !source.includes(endpoint))

if (missing.length > 0) {
  console.error(`Missing API contract endpoints: ${missing.join(', ')}`)
  process.exit(1)
}

const requiredOperations = [
  "request<DepartmentView>('/tenant/departments', { method: 'post'",
  "request<KnowledgeArticleView>('/tenant/knowledge', { method: 'post'",
  "request<ChannelConfigView>('/tenant/channels', { method: 'put'",
  "request<ApprovalRuleView>('/quotation/approval-rules', { method: 'post'",
  "request<ChannelCredentialView>('/inquiry/channel-credentials', { method: 'post'",
  "request<EmailMailboxView>('/inquiry/email-mailboxes', { method: 'post'",
  "request<SubscriptionOrderView>('/tenant/billing/orders', { method: 'post'"
]

const missingOperations = requiredOperations.filter((operation) => !source.includes(operation))
if (missingOperations.length > 0) {
  console.error(`Missing API contract operations: ${missingOperations.join(', ')}`)
  process.exit(1)
}

const openApiPath = resolve(root, 'public/openapi.yaml')
const openApi = existsSync(openApiPath) ? readFileSync(openApiPath, 'utf8') : ''
if (!openApi.includes('openapi: 3.1.0') || !openApi.includes('/api/inquiry/inbound/{credentialId}')) {
  console.error('Public OpenAPI contract is missing or incomplete')
  process.exit(1)
}

console.log('API contract check passed')
