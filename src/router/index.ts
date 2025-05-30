import axios from 'axios'
import { makeRequest } from '@lib/utils'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import project from '@/jsons/project.json'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home.vue'),
    meta: { reqLogin: true }
  },
  {
    path: '/model/:mname',
    name: 'adminModel',
    component: () => import('@/views/model.vue'),
    meta: { reqAdmin: true }
  },
  {
    path: '/pubAnno',
    name: 'adminPubAnno',
    component: () => import('@/views/pubAnno.vue'),
    meta: { reqAdmin: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login.vue')
  },
  {
    path: '/user_login',
    name: 'userLogin',
    component: () => import('@/views/user.vue'),
    meta: { reqLogin: true }
  },
  {
    path: '/user_order',
    name: 'userOrder',
    component: () => import('@/views/userOrder.vue'),
    meta: { reqLogin: true }
  },
  {
    path: '/user_profile',
    name: 'userProfile',
    component: () => import('@/views/userProfile.vue'),
    meta: { reqLogin: true }
  },
  {
    path: '/manager_order',
    name: 'managerOrder',
    component: () => import('@/views/mgrOrder.vue'),
    meta: { reqManager: true }
  }
]

const router = createRouter({
  history: createWebHistory('/' + project.name),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some(record => record.meta.reqLogin || to.meta.reqManager || to.meta.reqAdmin) && true) {
    try {
      const result = await makeRequest(
        axios.post(['/chamber_order_sys', '/api/v1/', 'user', '/verify'].join(''), undefined, {
          headers: { authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
        })
      )
      if (result.error || !result.payload) {
        throw new Error(result.error || '鉴权失败，没有载荷！')
      }
      const payload = result.payload
      switch (true) {
        case to.meta.reqAdmin && payload.roles.includes('admin'):
          return next()
        case to.meta.reqManager && payload.roles.includes('manager'):
          return next()
        case to.meta.reqLogin && payload.roles.includes('user'):
          return next()
      }
      throw new Error()
    } catch (e) {
      next({
        path: '/login',
        query: {
          redirect: to.fullPath
        }
      })
    }
  } else {
    next() // 确保一定要调用 next()
  }
})

export default router
