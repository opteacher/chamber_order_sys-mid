<template>
  <UserLayout>
    <div class="h-full flex flex-col">
      <a-divider class="border-slate-300">
        <a-radio-group v-model:value="category" button-style="solid" @change="refresh">
          <a-radio-button value="available">可用氧舱</a-radio-button>
          <a-badge :count="myOrders.filter(order => order.status !== '已失效').length">
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
                  <a-tag :color="chamberStatColor[item.status as ChamberStatus]">
                    {{ item.status }}
                  </a-tag>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button
                  v-if="!allLock"
                  type="primary"
                  ghost
                  :disabled="item.status !== '运行中'"
                  @click="() => onOrder(item)"
                >
                  预约
                </a-button>
                <a-space v-else align="baseline">
                  <InfoCircleOutlined />
                  已预约氧舱
                </a-space>
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
        >
          <template #renderItem="{ item }">
            <a-list-item class="hover:bg-slate-200">
              <a-list-item-meta>
                <template #title>
                  {{ item.chamber.name }}&nbsp;
                  <a-tag :color="orderStatColor[item.status as OrderStatus]">
                    {{ item.status }}
                  </a-tag>
                </template>
                <template #description>
                  {{ item.odDtTm.format('YYYY/MM/DD HH:mm:ss') }}&nbsp;{{ item.duration }}分钟
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button
                  danger
                  ghost
                  :disabled="item.status !== '未到时'"
                  @click="() => onCancelOrder(item)"
                >
                  取消
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </div>
      <FormDialog
        title="确定预约该氧舱吗？"
        icon="ExclamationCircleOutlined"
        width="80vw"
        :mapper="orderConfm.mapper"
        :emitter="orderConfm.emitter"
        :newFun="genNewOrder"
        @submit="onOrderConform"
      />
    </div>
  </UserLayout>
</template>

<script setup lang="ts">
import { createVNode, onMounted, reactive, ref } from 'vue'
import UserLayout from '@/layouts/user.vue'
import Chamber, { ChamberStatus, statusColor as chamberStatColor } from '@/types/chamber'
import api from '@/apis/model'
import lgnAPI from '@/apis/login'
import Order, { OrderStatus, statusColor as orderStatColor } from '@/types/order'
import models from '@/jsons/models.json'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { TinyEmitter } from 'tiny-emitter'
import { Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import _ from 'lodash'
import Config from '@/types/config'

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
      type: 'DateTime',
      format: 'YYYY/MM/DD HH:mm',
      minuteStep: 5
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
const allLock = ref(false)
const allPoints = Array.from({ length: 24 }, (_, i) => i)

onMounted(refresh)

async function refresh() {
  loading.value = true
  chambers.splice(0, chambers.length, ...(await api.all('chamber', { copy: Chamber.copy })))
  const { payload } = await lgnAPI.verify()
  const orders = (await api.all('order', {
    copy: Order.copy,
    axiosConfig: { params: { fkUser: payload.sub, _ext: true } }
  })) as Order[]
  myOrders.splice(
    0,
    myOrders.length,
    ..._.remove(orders, order => order.status === '进行中'),
    ..._.remove(orders, order => order.status === '未到时'),
    ...orders
  )
  allLock.value = myOrders.filter(order => ['未到时', '进行中'].includes(order.status)).length !== 0
  const orderPoints = await api
    .all('config', { copy: Config.copy })
    .then((configs: Config[]) => (configs.length ? configs[0].orderPoints : allPoints))
  orderConfm.emitter.emit('update:mprop', {
    'odDtTm.dsbHours': allPoints.filter(point => !orderPoints.includes(point))
  })
  loading.value = false
}
function onOrder(chamber: Chamber) {
  orderConfm.emitter.emit('update:visible', { show: true, object: genNewOrder([chamber]) })
}
async function onOrderConform(order: Order & { chamber: Chamber[] }, next: Function) {
  const newOrder = await api.add('order', order, {
    ignores: ['fkChamber', 'fkUser'],
    copy: Order.copy
  })
  const chamber = order.chamber[0]
  await api.link('order', newOrder.key, 'fkChamber', chamber.key)
  const { payload } = await lgnAPI.verify()
  await api.link('order', newOrder.key, 'fkUser', payload.sub)
  await api.update('chamber', chamber.key, { status: '已预约' })
  await refresh()
  next()
}
function genNewOrder(chamber: Chamber[] = []) {
  return { ...new Order(), chamber }
}
function onCancelOrder(order: Order) {
  Modal.confirm({
    title: '确定取消该预约？',
    icon: createVNode(ExclamationCircleOutlined),
    async onOk() {
      await api.update('order', order.key, { status: '已失效' })
      await api.update('chamber', order.fkChamber, { status: '运行中' })
      await refresh()
    }
  })
}
</script>
