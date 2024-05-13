<template>
  <div class="h-full flex flex-col">
    <a-page-header :title="pageTitles[userPage]" @back="onToPageClick">
      <template #backIcon>
        <UserOutlined v-if="userPage === 'user_order'" />
        <HomeOutlined v-else />
      </template>
      <template #extra>
        <a-button danger @click="onLogout">
          <template #icon><LogoutOutlined /></template>
          登出
        </a-button>
      </template>
    </a-page-header>
    <div class="flex-1 px-6">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { LogoutOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons-vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import project from '@/jsons/project.json'

const route = useRoute()
const router = useRouter()
const userPage = ref('user_order')
const pageTitles = {
  user_order: '高压氧舱',
  user_profile: '用户配置'
} as any

onMounted(refresh)
router.beforeEach(refresh)

function refresh() {
  const paths = route.path.split('/')
  userPage.value = paths[paths.length - 1]
}
function onLogout() {
  localStorage.removeItem('token')
  router.replace(`/${project.name}/login`)
}
function onToPageClick() {
  router.push(userPage.value === 'user_order' ? 'user_profile' : 'user_order')
}
</script>
