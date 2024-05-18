<template>
  <UserLayout>
    <div class="h-full flex flex-col">
      <a-divider class="border-slate-300">
        <a-radio-group v-model:value="category" button-style="solid" @change="refresh">
          <a-radio-button value="available">可用氧舱</a-radio-button>
          <a-badge :count="myOrders.filter(order => order.lastState !== '已失效').length">
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
                  :disabled="['已停止', '异常'].includes(item.status)"
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
                  <a-tag :color="orderStatColor[item.lastState as OrderStatus]">
                    {{ item.lastState }}
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
                  :disabled="item.lastState !== '未到时'"
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
      >
        <template #odDtTm="{ formState }">
          <a-date-picker
            class="w-full"
            placeholder="请选择"
            :format="odDtTmMapper.format"
            :show-time="odDtTmMapper.showTime"
            :disabledDate="odDtTmMapper.dsbDates"
            :value="getProp(formState, 'odDtTm', null)"
            @change="
              (newVal: any) => {
                setProp(formState, 'odDtTm', newVal)
                odDtTmMapper.onChange(formState, newVal)
              }
            "
          >
            <template #dateRender="{ current }">
              <OdDateCard :hasOrder="dateHasOrder(current)" :current="current" />
            </template>
          </a-date-picker>
        </template>
      </FormDialog>
    </div>
  </UserLayout>
</template>

<script setup lang="ts">
import { computed, createVNode, onMounted, reactive, ref } from 'vue'
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
import { numToClock, dtTmFmt, sysConf, getProp, setProp, dateFmt } from '@/utils'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/zh-cn'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import OdDateCard from '@/components/userOrder/OdDateCard.vue'

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
      format: dateFmt,
      showTime: false,
      dsbDates: (date: Dayjs) => {
        const strDate = date.format(dateFmt)
        const isWeekend = [0, 6].includes(date.day())
        return (
          date.isBefore(dayjs().startOf('day')) ||
          (!sysConf.odAvaDates.includes(strDate) &&
            (sysConf.odAvaDates.includes('!' + strDate) || isWeekend))
        )
      },
      onChange: (_unuse: any, date?: Dayjs) => {
        if (!date) {
          orderConfm.emitter.emit('update:mprop', { 'duration.options': [] })
          return
        }
        const dateNow = dayjs.tz()
        let orderPoints = _.clone(
          sysConf.orderPoints.length ? sysConf.orderPoints.sort((a, b) => a - b) : allPoints
        )
        if (date.isSame(dateNow, 'day')) {
          const curPoint = dateNow.hour() + (dateNow.minute() > 30 ? 0.5 : 0)
          orderPoints = orderPoints.filter(point => point > curPoint)
        }
        const strDate = date.format(dateFmt)
        const orders = Object.entries(orderConfm.datetimes)
          .map(([dtTm, order]) => (dtTm.startsWith(strDate) ? order : null))
          .filter(order => order) as Order[]
        const dsbPoints = orders.map(order => order.duration)
        orderConfm.emitter.emit('update:mprop', {
          'duration.options': orderPoints.map(idx => ({
            label: numToClock(idx, true),
            value: idx,
            disabled: dsbPoints.includes(idx)
          }))
        })
      }
    },
    duration: {
      label: '使用时段',
      type: 'Select',
      allowClear: true
    }
  }),
  emitter: new TinyEmitter(),
  datetimes: {} as Record<string, Order>
})
const odDtTmMapper = computed(() => orderConfm.mapper['odDtTm'])
const loading = ref(false)
const allLock = ref(false)

onMounted(refresh)
orderConfm.emitter.on('show', async (order: Order) => {
  orderConfm.datetimes = Object.fromEntries(
    await api
      .all('order', {
        copy: Order.copy,
        axiosConfig: { params: { fkChamber: order.chamber?.key, lastState: '未到时' } }
      })
      .then(orders =>
        orders.map((order: Order) => [
          [order.odDtTm.format(dateFmt), numToClock(order.duration)].join('T'),
          order
        ])
      )
  )
})

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
    ..._.remove(orders, order => order.lastState === '进行中'),
    ..._.remove(orders, order => order.lastState === '未到时'),
    ...orders
  )
  allLock.value =
    !sysConf.orderOnOff ||
    myOrders.filter(order => ['未到时', '进行中'].includes(order.lastState)).length !== 0
  loading.value = false
}
function onOrder(chamber: Chamber) {
  orderConfm.emitter.emit('update:visible', { show: true, object: genNewOrder([chamber]) })
}
async function onOrderConform(order: Order & { chamber: Chamber[] }, next: Function) {
  const newOrder = await api.add(
    'order',
    Object.assign(order, {
      status: [['未到时', dayjs().format(dtTmFmt)].join('|')],
      lastState: '未到时'
    }),
    {
      ignores: ['fkChamber', 'fkUser', 'chamber', 'user'],
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
  return { odDtTm: null, duration: null, chamber }
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
          status: ['已失效', dayjs().format(dtTmFmt)].join('|'),
          lastState: '已失效'
        },
        { axiosConfig: { params: { _updMode: 'append' } } }
      )
      await api.update('chamber', order.fkChamber, { status: '运行中' })
      await refresh()
    }
  })
}
function dateHasOrder(date: Dayjs) {
  return Object.keys(orderConfm.datetimes)
    .map(dtTm => dtTm.split('T')[0])
    .includes(date.format(dateFmt))
}
</script>
