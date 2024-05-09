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

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: `/${project.name}/`
  },
  {
    path: `/${project.name}/`,
    redirect: `/${project.name}/home`
  },
  {
    path: `/${project.name}/home`,
    name: 'Home',
    component: Home
  },
  {
    path: `/${project.name}/:mname`,
    name: 'model',
    component: Model,
    meta: { reqLogin: true }
  },
  {
    path: '/chamber_order_sys/login',
    name: 'login',
    component: login
  },
  {
    path: '/chamber_order_sys/user_login',
    name: 'userLogin',
    component: user,
    meta: { reqLogin: true }
  },
  {
    path: '/chamber_order_sys/user_order',
    name: 'order',
    component: user,
    meta: { reqLogin: true }
  },
  {
    path: '/chamber_order_sys/user_profile',
    name: 'profile',
    component: user,
    meta: { reqLogin: true }
  },
  {
    path: '/chamber_order_sys/userOrder',
    name: 'userOrder',
    component: userOrder
  },
  {
    path: '/chamber_order_sys/userProfile',
    name: 'userProfile',
    component: userProfile
  },
]

const router = createRouter({
  history: createWebHistory(),
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
        throw new Error(result.error || '没有载荷！')
      }
      const payload = result.payload
      console.log(payload)
      next()
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
