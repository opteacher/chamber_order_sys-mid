import axios from 'axios'
import { makeRequest } from '@lib/utils'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Model from '@/views/model.vue'
import login from '../views/login.vue'
import project from '@/jsons/project.json'
import Home from '@/views/home.vue'
import user from '@/views/user.vue'
import userOrder from '@/views/userOrder.vue'
import userProfile from '@/views/userProfile.vue'
import pubAnno from '@/views/pubAnno.vue'
import mgrOrder from '@/views/mgrOrder.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: `/${project.name}/`
  },
  {
    path: `/${project.name}/`,
    redirect: `/${project.name}/model/chamber`
  },
  {
    path: `/${project.name}/home`,
    name: 'Home',
    component: () => import('@/views/home.vue'),
    meta: { reqLogin: true }
  },
  {
    path: `/${project.name}/model/:mname`,
    name: 'model',
    component: () => import('@/views/model.vue'),
    meta: { reqLogin: true }
  },
  {
    path: `/${project.name}/pubAnno`,
    name: 'pubAnno',
    component: () => import('@/views/pubAnno.vue'),
    meta: { reqLogin: true }
  },
  {
    path: `/${project.name}/login`,
    name: 'login',
    component: () => import('@/views/login.vue')
  },
  {
    path: `/${project.name}/user_login`,
    name: 'userLogin',
    component: () => import('@/views/user.vue'),
    meta: { reqLogin: true }
  },
  {
    path: `/${project.name}/user_order`,
    name: 'userOrder',
    component: () => import('@/views/userOrder.vue'),
    meta: { reqLogin: true }
  },
  {
    path: `/${project.name}/user_profile`,
    name: 'userProfile',
    component: () => import('@/views/userProfile.vue'),
    meta: { reqLogin: true }
  },
  {
    path: `/${project.name}/manager_order`,
    name: 'managerOrder',
    component: () => import('@/views/mgrOrder.vue'),
    meta: { reqLogin: true }
  }
]

const router = createRouter({
  history: createWebHistory('/' + project.name),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some(record => record.meta.reqLogin) && true) {
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
        case payload.roles.includes('admin'):
          next()
          break
        case payload.roles.includes('manager'):
          next('/chamber_order_sys/manager_order')
          break
        default:
          next('/chamber_order_sys/user_order')
          break
      }
    } catch (e) {
      next({
        path: '/chamber_order_sys/login',
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
