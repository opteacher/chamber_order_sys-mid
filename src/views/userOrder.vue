<template>
  <UserLayout>
    <div class="h-full flex flex-col">
      <a-divider class="border-slate-300">
        <a-radio-group v-model:value="category" button-style="solid">
          <a-radio-button value="available">可用氧舱</a-radio-button>
          <a-badge count="5">
            <a-radio-button class="border-l-0 rounded-l-none rounded-r-md" value="ordered">
              我的预约
            </a-radio-button>
          </a-badge>
        </a-radio-group>
      </a-divider>
      <div class="flex-1 flex justify-center">
        <a-list
          v-if="category === 'available'"
          class="h-full w-full sm:w-[32rem]"
          item-layout="horizontal"
          :data-source="chambers"
        >
          <template #renderItem="{ item }">
            <a-list-item class="hover:bg-slate-200">
              <a-list-item-meta>
                <template #title>
                  {{ item.name }}&nbsp;
                  <a-tag :color="chamberStatColor(item.status)">{{ item.status }}</a-tag>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button
                  type="primary"
                  ghost
                  :disabled="item.status !== '运行中'"
                  @click="() => onOrder(item)"
                >
                  预约
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
        <a-list
          v-else
          class="h-full w-full sm:w-[32rem]"
          item-layout="horizontal"
          :data-source="myOrders"
        ></a-list>
      </div>
    </div>
  </UserLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import UserLayout from '@/layouts/user.vue'
import Chamber, { ChamberStatus, statusColor } from '@/types/chamber'
import api from '@/apis/model'
import Order from '@/types/order'

const category = ref<'available' | 'ordered'>('available')
const chambers = reactive<Chamber[]>([])
const myOrders = reactive<Order[]>([])

onMounted(refresh)

async function refresh() {
  chambers.splice(0, chambers.length, ...(await api.all('chamber', { copy: Chamber.copy })))
  console.log(chambers)
}
function onOrder(chamber: Chamber) {
  console.log(chamber)
}
function chamberStatColor(status: ChamberStatus) {
  return statusColor[status]
}
</script>
