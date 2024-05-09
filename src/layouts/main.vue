<template>
  <a-layout class="h-full">
    <a-layout-header class="pl-0 pr-5 flex">
      <div class="h-full p-2.5 bg-white" style="width: 200px">
        <div class="h-full bg-gray-300 rounded-sm" />
      </div>
      <div class="flex flex-1 leading-16 justify-between">
        <div />
        <a-popover v-if="(project.auth as any).model" placement="bottomRight">
          <template #content>
            <a-button type="primary" danger ghost @click="onLogoutClick">退出</a-button>
          </template>
          <a-button class="h-full w-16 rounded-none text-gray-300 hover:text-primary" type="text">
            <template #icon><UserOutlined class="text-2xl leading-none" /></template>
          </a-button>
        </a-popover>
      </div>
    </a-layout-header>
    <a-layout class="h-full">
      <a-layout-sider width="200">
        <a-menu
          :selectedKeys="sideKeys"
          :openKeys="openKeys"
          mode="inline"
          class="h-full border-r-0"
          theme="dark"
          @click="onMuItmSelect"
        >
          <a-menu-item key="home">首页</a-menu-item>
          <a-menu-item v-for="model in sdNavMdls" :key="model.name">
            {{ model.label }}
          </a-menu-item>
          <a-menu-item-group key="user">
            <template #title>用户页面</template>
            <a-menu-item key="user_profile">个人配置</a-menu-item>
            <a-menu-item key="user_order">预约氧舱</a-menu-item>
          </a-menu-item-group>
        </a-menu>
      </a-layout-sider>
      <a-layout>
        <a-layout-content class="bg-gray-300 p-2.5 m-0 h-full">
          <div class="bg-white h-full p-2.5"><slot /></div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import router from '../router'
import { SelectInfo } from 'ant-design-vue/lib/menu/src/interface'
import { onMounted, reactive, ref } from 'vue'
import project from '@/jsons/project.json'
import models from '@/jsons/models.json'
import { useRoute } from 'vue-router'
import { UserOutlined } from '@ant-design/icons-vue'
import api from '@/apis/model'

const route = useRoute()
const sdNavMdls = ref<{ name: string; label: string }[]>([])
const sideKeys = reactive<string[]>([])
const openKeys = reactive<string[]>([])

onMounted(async () => {
  const mdls = Object.values(models).filter((model: any) => model.disp)
  for (const mname of Object.keys(models)) {
    try {
      await api.all(mname, { messages: { notShow: true }, axiosConfig: { params: { limit: 1 } } })
    } catch (e) {
      mdls.splice(
        mdls.findIndex((mdl: any) => mdl.name === mname),
        1
      )
    }
  }
  sdNavMdls.value = mdls as { name: string; label: string }[]
  actSideKeys(route.path)
})
router.beforeEach(to => actSideKeys(to.path))

function actSideKeys(path: string) {
  const paths = path.split('/')
  sideKeys.splice(0, sideKeys.length, ...paths)
  if (paths.length) {
    openKeys.splice(0, openKeys.length, ...paths.slice(0, -1))
  }
}
function onMuItmSelect(params: SelectInfo) {
  router.push(`/${project.name}/` + (params.keyPath || []).join('/'))
}
function onLogoutClick() {
  window.localStorage.removeItem('token')
  router.replace({ path: `/${project.name}/login`, replace: true })
}
</script>
