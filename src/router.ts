import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import LoginView from './views/LoginView.vue'
import AppShell from './layouts/AppShell.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView },
    {
      path: '/',
      component: AppShell,
      children: [
        { path: '', component: () => import('./views/DashboardView.vue') },
        { path: 'customers', component: () => import('./views/CustomersView.vue') },
        { path: 'products', component: () => import('./views/ProductsView.vue') },
        { path: 'inquiries', component: () => import('./views/InquiriesView.vue') },
        { path: 'quotations', component: () => import('./views/QuotationsView.vue') },
        { path: 'orders', component: () => import('./views/OrdersView.vue') },
        { path: 'tasks', component: () => import('./views/TasksView.vue') },
        { path: 'notifications', component: () => import('./views/NotificationsView.vue') },
        {
          path: 'governance',
          component: () => import('./views/GovernanceView.vue'),
          meta: { roles: ['OWNER', 'ADMIN'] }
        }
      ]
    }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.restored) await auth.restore()
  if (to.path !== '/login' && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/'
  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && !allowedRoles.includes(auth.role)) return '/'
})

export default router
