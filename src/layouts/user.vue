<template>
  <div class="h-full flex flex-col">
    <a-page-header :title="pageTitle">
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
import { LogoutOutlined } from '@ant-design/icons-vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import project from '@/jsons/project.json'

const route = useRoute()
const router = useRouter()
const pageTitle = ref('')

onMounted(refresh)
router.beforeEach(refresh)

function refresh() {
  const paths = route.path.split('/')
  switch (paths[paths.length - 1]) {
    case 'user_order':
      pageTitle.value = '高压氧舱'
  }
}
function onLogout() {
  localStorage.removeItem('token')
  router.replace(`/${project.name}/login`)
}
</script>
