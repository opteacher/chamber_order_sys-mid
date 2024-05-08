<template>
  <MainLayout>
    <iframe class="w-full h-full border-none" :src="insUrl" />
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/main.vue'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { camelCase } from 'lodash-es'

const route = useRoute()
const insUrl = ref('')

onMounted(refresh)
watch(() => route.path, refresh)

function refresh() {
  const paths = route.path.split('/')
  insUrl.value = camelCase(paths[paths.length - 1])
}
</script>
