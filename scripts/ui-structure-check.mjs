import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const router = readFileSync(resolve(root, 'src/router.ts'), 'utf8')
const loginView = readFileSync(resolve(root, 'src/views/LoginView.vue'), 'utf8')
const publicHome = readFileSync(resolve(root, 'src/views/PublicHomeView.vue'), 'utf8')
const legalView = readFileSync(resolve(root, 'src/views/LegalView.vue'), 'utf8')
const loginCharactersPath = resolve(root, 'src/components/auth/AnimatedLoginCharacters.vue')
const loginCharacterAssets = [
  'chiikawa-login.png', 'hachiware-login.png', 'usagi-login.png',
  'chiikawa-cover.png', 'hachiware-cover.png', 'usagi-cover.png'
]
  .map(name => resolve(root, 'public/images/characters', name))
const views = ['DashboardView', 'CustomersView', 'ProductsView', 'InquiriesView', 'QuotationsView', 'OrdersView', 'TasksView', 'NotificationsView', 'GovernanceView', 'HelpCenterView']
const routes = ['customers', 'products', 'inquiries', 'quotations', 'orders', 'tasks', 'notifications', 'governance', 'help']
const missingViews = views.filter(name => !existsSync(resolve(root, `src/views/${name}.vue`)))
const missingRoutes = routes.filter(path => !router.includes(`path: '${path}'`))

if (missingViews.length || missingRoutes.length) {
  console.error(`UI structure incomplete. Views: ${missingViews.join(', ')} Routes: ${missingRoutes.join(', ')}`)
  process.exit(1)
}

const publicSiteChecks = [
  router.includes("path: '/', name: 'public-home'"),
  router.includes("path: '/privacy', name: 'privacy'"),
  router.includes("path: '/terms', name: 'terms'"),
  router.includes("path: '/app'"),
  router.includes('meta: { requiresAuth: true }'),
  router.includes("query: { redirect: to.fullPath }"),
  publicHome.includes('进入企业工作台'),
  publicHome.includes('id="workflow"'),
  publicHome.includes('id="security"'),
  publicHome.includes('id="pricing"'),
  legalView.includes('隐私政策'),
  legalView.includes('服务条款'),
  loginView.includes('workspaceDestination')
]

if (publicSiteChecks.some(result => !result)) {
  console.error('Public website and protected workspace routing are incomplete')
  process.exit(1)
}

const loginAnimationChecks = [
  existsSync(loginCharactersPath),
  loginCharacterAssets.every(existsSync),
  loginView.includes('<AnimatedLoginCharacters'),
  loginView.includes(':is-typing="isAccountTyping"'),
  loginView.includes(':is-password-active="isAccountPasswordActive"'),
  loginView.includes(':is-password-visible="showAccountPassword"'),
  loginView.includes(':is-loading="loading || sending || captchaLoading"'),
  loginView.includes(':reaction="characterReaction"')
]

if (loginAnimationChecks.some(result => !result)) {
  console.error('Login animation integration is incomplete')
  process.exit(1)
}

console.log('UI structure check passed')
