<template>
  <UserLayout>
    <div class="h-full flex flex-col">
      <a-divider class="border-slate-300">
        <a-radio-group v-model:value="category" button-style="solid" @change="refresh">
          <a-radio-button value="available">可用氧舱</a-radio-button>
          <a-badge :count="myOrders.filter(order => getOrderCurStatus(order) !== '已失效').length">
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
                <a-space v-if="allLock" align="baseline">
                  <InfoCircleOutlined />
                  {{ !sysConf.orderOnOff ? '预约系统关闭' : '已预约氧舱' }}
                </a-space>
                <a-button
                  v-else
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
        >
          <template #renderItem="{ item }">
            <a-list-item class="hover:bg-slate-200">
              <a-list-item-meta>
                <template #title>
                  {{ item.chamber.name }}&nbsp;
                  <a-tag :color="orderStatColor[getOrderCurStatus(item) as OrderStatus]">
                    {{ getOrderCurStatus(item) }}
                  </a-tag>
                </template>
                <template #description>
                  {{ item.odDtTm ? item.odDtTm.format('YYYY/MM/DD HH:mm:ss') : 'invalid date' }}
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-space v-if="!sysConf.orderOnOff" align="baseline">
                  <InfoCircleOutlined />
                  预约系统关闭
                </a-space>
                <a-button
                  v-else
                  danger
                  ghost
                  :disabled="getOrderCurStatus(item) !== '未到时'"
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
import { getOrderCurStatus, numToClock, dtTmFmt, sysConf } from '@/utils'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/zh-cn'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.locale('zh-cn')
dayjs.extend(isSameOrBefore)
dayjs.extend(utc)
dayjs.extend(timezone)

const allPoints = Array.from({ length: 48 }, (_, i) => i / 2)
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
      format: 'YYYY/MM/DD',
      showTime: false,
      empty: true,
      dsbDates: (date: Dayjs) => {
        const strDate = date.format('YYYY-M-D')
        const isWeekend = [0, 6].includes(date.day())
        return (
          date.isBefore(dayjs().startOf('day')) ||
          (!sysConf.odAvaDates.includes(strDate) &&
            (sysConf.odAvaDates.includes('!' + strDate) || isWeekend))
        )
      }
    },
    duration: {
      label: '使用时段',
      type: 'Select',
      allowClear: true,
      empty: true,
      options: allPoints.map(idx => ({ label: numToClock(idx, true), value: idx })),
      onDropdown: () => {
        const dateNow = dayjs.tz()
        const curPoint = dateNow.hour() + (dateNow.minute() > 30 ? 0.5 : 0)
        const orderPoints = sysConf.orderPoints.length
          ? sysConf.orderPoints.sort((a, b) => a - b)
          : allPoints
        orderConfm.emitter.emit('update:mprop', {
          'duration.options': orderPoints
            .filter(point => point > curPoint)
            .map(idx => ({ label: numToClock(idx, true), value: idx }))
        })
      }
    }
  }),
  emitter: new TinyEmitter()
})
const loading = ref(false)
const allLock = ref(false)

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
    ..._.remove(orders, order => getOrderCurStatus(order) === '进行中'),
    ..._.remove(orders, order => getOrderCurStatus(order) === '未到时'),
    ...orders
  )
  allLock.value =
    !sysConf.orderOnOff ||
    myOrders.filter(order => ['未到时', '进行中'].includes(getOrderCurStatus(order))).length !== 0
  const orderPoints = sysConf.orderPoints.length
    ? sysConf.orderPoints.sort((a, b) => a - b)
    : allPoints
  orderConfm.emitter.emit('update:mprop', {
    'duration.options': orderPoints.map(idx => ({ label: numToClock(idx, true), value: idx }))
  })
  loading.value = false
}
function onOrder(chamber: Chamber) {
  orderConfm.emitter.emit('update:visible', { show: true, object: genNewOrder([chamber]) })
}
async function onOrderConform(order: Order & { chamber: Chamber[] }, next: Function) {
  const newOrder = await api.add(
    'order',
    Object.assign(order, { status: [['未到时', dayjs().format(dtTmFmt)].join('|')] }),
    {
      ignores: ['fkChamber', 'fkUser'],
      copy: Order.copy
    }
  )
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
      await api.update(
        'order',
        order.key,
        {
          status: ['已失效', dayjs().format(dtTmFmt)].join('|')
        },
        { axiosConfig: { params: { _updMode: 'append' } } }
      )
      await api.update('chamber', order.fkChamber, { status: '运行中' })
      await refresh()
    }
  })
}
</script>
