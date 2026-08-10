import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const router = readFileSync(resolve(root, 'src/router.ts'), 'utf8')
const loginView = readFileSync(resolve(root, 'src/views/LoginView.vue'), 'utf8')
const loginCharactersPath = resolve(root, 'src/components/auth/AnimatedLoginCharacters.vue')
const loginCharacterAssets = [
  'chiikawa-login.png', 'hachiware-login.png', 'usagi-login.png',
  'chiikawa-cover.png', 'hachiware-cover.png', 'usagi-cover.png'
]
  .map(name => resolve(root, 'public/images/characters', name))
const views = ['DashboardView', 'CustomersView', 'ProductsView', 'InquiriesView', 'QuotationsView', 'OrdersView', 'TasksView', 'NotificationsView', 'GovernanceView']
const routes = ['customers', 'products', 'inquiries', 'quotations', 'orders', 'tasks', 'notifications', 'governance']
const missingViews = views.filter(name => !existsSync(resolve(root, `src/views/${name}.vue`)))
const missingRoutes = routes.filter(path => !router.includes(`path: '${path}'`))

if (missingViews.length || missingRoutes.length) {
  console.error(`UI structure incomplete. Views: ${missingViews.join(', ')} Routes: ${missingRoutes.join(', ')}`)
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
