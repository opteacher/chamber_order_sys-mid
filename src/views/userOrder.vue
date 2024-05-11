<template>
  <UserLayout>
    <div class="h-full flex flex-col">
      <a-divider class="border-slate-300">
        <a-radio-group v-model:value="category" button-style="solid" @change="refresh">
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
          :loading="loading"
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
          :loading="loading"
          item-layout="horizontal"
          :data-source="myOrders"
        ></a-list>
      </div>
      <FormDialog
        title="确定预约该氧舱吗？"
        icon="ExclamationCircleOutlined"
        width="80vw"
        :mapper="orderConfm.mapper"
        :emitter="orderConfm.emitter"
        :newFun="newOrder"
        @submit="onOrderConform"
      />
    </div>
  </UserLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import UserLayout from '@/layouts/user.vue'
import Chamber, { ChamberStatus, statusColor } from '@/types/chamber'
import api from '@/apis/model'
import lgnAPI from '@/apis/login'
import Order from '@/types/order'
import models from '@/jsons/models.json'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { TinyEmitter } from 'tiny-emitter'

const category = ref<'available' | 'ordered'>('available')
const chambers = reactive<Chamber[]>([])
const myOrders = reactive<Order[]>([])
const orderConfm = reactive({
  mapper: new Mapper({
    chamber: {
      label: '高压氧舱',
      type: 'Table',
      mapper: new Mapper({
        name: { label: '舱名', type: 'Input' },
        status: { label: '状态', type: 'Input' }
      }),
      columns: models.chamber.table.columns.map(col => Column.copy(col)),
      addable: false,
      edtable: false,
      delable: false
    },
    odDtTm: {
      label: '预约时间',
      type: 'DateTime'
    },
    duration: {
      label: '使用时长',
      type: 'Number',
      suffix: '分钟'
    }
  }),
  emitter: new TinyEmitter()
})
const loading = ref(false)

onMounted(refresh)

async function refresh() {
  loading.value = true
  chambers.splice(0, chambers.length, ...(await api.all('chamber', { copy: Chamber.copy })))
  const { payload } = await lgnAPI.verify()
  myOrders.splice(
    0,
    myOrders.length,
    ...(await api.all('order', {
      copy: Order.copy,
      axiosConfig: { params: { users: payload.sub } }
    }))
  )
  loading.value = false
}
function onOrder(chamber: Chamber) {
  orderConfm.emitter.emit('update:visible', { show: true, object: newOrder([chamber]) })
}
function chamberStatColor(status: ChamberStatus) {
  return statusColor[status]
}
async function onOrderConform(order: Order & { chamber: Chamber[] }, next: Function) {
  const newOrder = await api.add('order', order, { ignores: ['chambers', 'users'], copy: Order.copy })
  await api.link('order', newOrder.key, 'chambers', order.chamber[0].key)
  next()
}
function newOrder(chamber: Chamber[] = []) {
  return { ...new Order(), chamber }
}
</script>
