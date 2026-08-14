import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import LoginView from './views/LoginView.vue'
import AppShell from './layouts/AppShell.vue'
import PublicHomeView from './views/PublicHomeView.vue'
import LegalView from './views/LegalView.vue'

function safeWorkspacePath(value: unknown) {
  return typeof value === 'string' && (value === '/app' || value.startsWith('/app/')) ? value : '/app'
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'public-home', component: PublicHomeView },
    { path: '/privacy', name: 'privacy', component: LegalView },
    { path: '/terms', name: 'terms', component: LegalView },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/app',
      component: AppShell,
      meta: { requiresAuth: true },
      children: [
        { path: '', component: () => import('./views/DashboardView.vue') },
        { path: 'customers', component: () => import('./views/CustomersView.vue') },
        { path: 'products', component: () => import('./views/ProductsView.vue') },
        { path: 'inquiries', component: () => import('./views/InquiriesView.vue') },
        { path: 'quotations', component: () => import('./views/QuotationsView.vue') },
        { path: 'orders', component: () => import('./views/OrdersView.vue') },
        { path: 'tasks', component: () => import('./views/TasksView.vue') },
        { path: 'notifications', component: () => import('./views/NotificationsView.vue') },
        { path: 'help', component: () => import('./views/HelpCenterView.vue') },
        {
          path: 'governance',
          component: () => import('./views/GovernanceView.vue'),
          meta: { roles: ['OWNER', 'ADMIN'] }
        }
      ]
    },
    ...['customers', 'products', 'inquiries', 'quotations', 'orders', 'tasks', 'notifications', 'governance', 'help'].map(path => ({
      path: `/${path}`,
      redirect: `/app/${path}`
    })),
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  if ((requiresAuth || to.path === '/login') && !auth.restored) await auth.restore()
  if (requiresAuth && !auth.token) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.path === '/login' && auth.token) return safeWorkspacePath(to.query.redirect)
  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && !allowedRoles.includes(auth.role)) return '/app'
})

export default router
