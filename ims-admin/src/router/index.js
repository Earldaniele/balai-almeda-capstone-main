import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/services/api.js'
import AdminLayoutView from '@/layouts/AdminLayoutView.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ReservationsView from '@/views/ReservationsView.vue'
import POSView from '@/views/POSView.vue'
import HouseKeepingView from '@/views/HouseKeepingView.vue'
import HRView from '@/views/HRView.vue'
import ShiftView from '@/views/ShiftView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Login Route (outside admin layout)
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    // Root redirect to login
    {
      path: '/',
      redirect: '/login'
    },
    // Admin Routes (with layout)
    {
      path: '/admin',
      component: AdminLayoutView,
      redirect: '/admin/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: DashboardView
        },
        {
          path: 'reservations',
          name: 'Reservations',
          component: ReservationsView
        },
        {
          path: 'pos',
          name: 'POS & Orders',
          component: POSView
        },
        {
          path: 'housekeeping',
          name: 'Housekeeping',
          component: HouseKeepingView
        },
        {
          path: 'hr',
          name: 'HR & Staff',
          component: HRView
        },
        {
          path: 'shift',
          name: 'Shift & Cash',
          component: ShiftView
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/DashboardView.vue') // Placeholder for now
        }
      ]
    },
    // Catch-all redirect to login
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login'
    }
  ],
})

// Navigation guard — protect /admin routes
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !isAuthenticated()) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated()) {
    // Already logged in, redirect to dashboard
    next('/admin/dashboard')
  } else {
    next()
  }
})

export default router
