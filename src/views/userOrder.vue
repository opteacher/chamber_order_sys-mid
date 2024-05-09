<template>
  <a-radio-group v-model:value="category" button-style="solid">
    <a-radio-button value="available">可用氧舱</a-radio-button>
    <a-radio-button value="ordered">已预约</a-radio-button>
  </a-radio-group>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import project from '@/jsons/project.json'

const router = useRouter()
const category = ref<'available' | 'ordered'>('available')

onMounted(() => {
  if (!localStorage.getItem('userToken')) {
    router.replace(`/${project.name}/login`)
  }
})
</script>
