<template>
  <MainLayout>
    <EditableTable
      :api="{
        all: onGetAll,
        add: onAdd,
        update: onUpdate,
        remove: onRemove
      }"
      sclHeight="h-full"
      :mapper="mapper"
      :columns="columns"
      :new-fun="() => genDftFmProps(model.props)"
      :emitter="emitter"
      :size="table.size"
      :mountRefsh="false"
      :pagable="table.hasPages"
      :refOptions="table.refresh"
      :dspCols="table.colDspable"
      :imExport="table.imExport"
      :editable="table.operable.includes('可编辑')"
      :addable="table.operable.includes('可增加')"
      :delable="table.operable.includes('可删除')"
      @expand="onRecordExpanded"
      @before-save="onOrderBefSave"
    >
      <template v-if="mname === 'order'" #extra>
        <a-button @click="onDateTimeSelect">选择时间段</a-button>
        <a-modal
          title="可预约时间"
          width="50vw"
          v-model:open="orderOptions.visible"
          @ok="onOrderPointsSubmit"
        >
          <a-form layout="vertical">
            <a-form-item label="可预约日期">
              <MpvueCalendar
                class="w-full"
                select-mode="multi"
                class-name="multi-mode"
                :format="formatOfYearMonth"
                :select-date="orderOptions.selDates"
                @onMonthChange="onMonthChange"
                @onSelect="onDateSelect"
              />
            </a-form-item>
            <a-form-item>
              <template #label>
                可预约时刻
                <a-typography-text class="ml-5" type="secondary">
                  <ExclamationCircleOutlined />
                  &nbsp;此为开始时刻，结束时刻会向后延半小时。如选定16:00，使用时段为16:00 ~ 16:30
                </a-typography-text>
              </template>
              <a-row class="mt-5" :gutter="8">
                <a-col
                  v-for="idx of Array.from({ length: 48 }, (_, i) => i / 2)"
                  :key="idx"
                  class="mb-3"
                  :span="3"
                >
                  <a-button
                    class="w-full"
                    :type="sysConf.orderPoints.includes(idx) ? 'primary' : 'default'"
                    @click="() => onOrderTmPointClick(idx)"
                  >
                    {{ numToClock(idx) }}
                  </a-button>
                </a-col>
              </a-row>
            </a-form-item>
          </a-form>
        </a-modal>
      </template>
      <template v-else-if="mname === 'chamber'" #extra>
        <a-switch
          v-model:checked="sysConf.orderOnOff"
          checked-children="开启预约"
          un-checked-children="关闭预约"
          @click="onOrderableSwitch"
        />
      </template>
      <template #odDtTm="{ record }">
        {{ record.odDtTm ? dayjs(record.odDtTm).format('YYYY/MM/DD') : 'invalid date' }}
      </template>
      <template #fkChamber="{ record }">
        {{ record.chamber ? record.chamber.name : '-' }}
      </template>
      <template #fkChamberHD="{ column }">
        {{ column.title }}
        <a-button
          v-if="route.query.fkChamber"
          class="float-right"
          size="small"
          type="text"
          danger
          @click="onSchChamberClear"
        >
          <template #icon><ClearOutlined /></template>
        </a-button>
      </template>
      <template #fkUser="{ record }">
        {{ record.user ? `${record.user.name} / ${record.user.phone}` : '-' }}
      </template>
      <template #duration="{ record }">
        {{ record.duration }}:00 ~ {{ record.duration + 1 }}:00
      </template>
      <template v-if="mname === 'chamber'" #expandedRowRender="{ record }">
        <div :id="record.name" class="w-full h-64" />
      </template>
      <template v-if="mname === 'order'" #status="{ record }">
        <a-tag :color="statusColor[getOrderCurStatus(record)]">
          {{ getOrderCurStatus(record) || '-' }}
        </a-tag>
      </template>
      <template v-if="mname === 'order'" #statusEDT="{ editing }">
        <a-select
          :options="Object.keys(statusColor).map(state => ({ label: state, value: state }))"
          v-model:value="editing.state"
        />
      </template>
      <template v-if="mname === 'order'" #statusVW="{ current }">
        <ul class="list-none pl-0">
          <li v-for="state of current.status">
            【{{ state[0] }}】&nbsp;更新于：{{ state[1].format('YYYY/MM/DD HH:mm:ss') }}
          </li>
        </ul>
      </template>
      <template #operOrder="{ record }">
        <div class="flex space-x-2">
          <a-button
            v-if="!['进行中', '已失效'].includes(getOrderCurStatus(record))"
            type="primary"
            ghost
            size="small"
            @click.stop="() => onOrderStartUse(record)"
          >
            开始使用
          </a-button>
          <a-button
            v-if="!['已失效'].includes(getOrderCurStatus(record))"
            type="primary"
            ghost
            size="small"
            @click.stop="() => onOrderCancel(record)"
            danger
          >
            失效
          </a-button>
        </div>
      </template>
      <template #detail="{ record }">
        <a-button
          type="primary"
          ghost
          size="small"
          @click.stop="
            () =>
              $router.push({
                path: `/${project.name}/model/order`,
                query: { fkChamber: record.key }
              })
          "
        >
          查看预约单
        </a-button>
      </template>
    </EditableTable>
  </MainLayout>
</template>

<script setup lang="ts">
import { watch, ref, onMounted, reactive, createVNode } from 'vue'
import MainLayout from '@/layouts/main.vue'
import models from '@/jsons/models.json'
import { useRoute, useRouter } from 'vue-router'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Mapper, { createByFields } from '@lib/types/mapper'
import api from '@/apis/model'
import {
  genDftFmProps,
  renderItem,
  getOrderCurStatus,
  orderStatusToChartData,
  numToClock,
  formatOfYearMonth,
  dtTmFmt,
  sysConf,
  getSysConf
} from '@/utils'
import Column from '@lib/types/column'
import Model from '@/types/bases/model'
import Table from '@/types/bases/table'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import Order, { OrderStatus, statusColor } from '@/types/order'
import _ from 'lodash'
import Chamber from '@/types/chamber'
import User from '@/types/user'
import orderStatus from '@/jsons/orderStatus.json'
import * as echarts from 'echarts'
import 'dayjs/locale/zh-cn'
import MpvueCalendar from 'mpvue-calendar'
import { ExclamationCircleOutlined, InfoCircleOutlined, ClearOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import project from '@/jsons/project.json'

dayjs.locale('zh-cn')
dayjs.extend(minMax)

const route = useRoute()
const router = useRouter()
const mname = ref<string>('')
const model = reactive<Model>(new Model())
const table = reactive<Table>(new Table())
const columns = ref<Column[]>([])
const mapper = ref<Mapper>(new Mapper())
const emitter = new Emitter()
const orderOptions = reactive({
  visible: false,
  yearMonth: [dayjs().year(), dayjs().month() + 1] as [number, number],
  selDates: [] as string[]
})
const copies = {
  chamber: Chamber.copy,
  order: Order.copy,
  user: User.copy
} as any

onMounted(refresh)
watch(() => route.params.mname, refresh)
// onUpdated(refresh)

async function refresh() {
  await getSysConf()
  mname.value = route.params.mname as string
  Model.copy((models as any)[mname.value], model)
  Table.copy(model.table, table)
  columns.value = table.columns.map((col: any) => Column.copy(col))
  mapper.value = createByFields(model.form.fields)
  emitter.emit('update:mapper', mapper.value)
  if (mname.value === 'order' && route.query.fkChamber) {
    emitter.emit('search', route.query)
  }
  emitter.emit('refresh')
}
function onGetAll() {
  return api.all(mname.value, {
    copy: copies[mname.value],
    axiosConfig: {
      params: { _ext: true }
    }
  })
}
function onAdd(record: any) {
  return api.add(
    mname.value,
    record,
    mname.value === 'order' ? { ignores: ['fkChamber', 'fkOrder'] } : undefined
  )
}
function onUpdate(record: any) {
  return api.update(
    mname.value,
    record.key,
    record,
    mname.value === 'order' ? { ignores: ['fkChamber', 'fkOrder'] } : undefined
  )
}
function onRemove(record: any) {
  return api.remove(mname.value, record.key)
}
function onOrderTmPointClick(idx: number) {
  if (sysConf.orderPoints.includes(idx)) {
    _.remove(sysConf.orderPoints, i => i === idx)
  } else {
    sysConf.orderPoints.push(idx)
  }
}
async function onOrderPointsSubmit() {
  await api.update('config', sysConf.key, {
    orderPoints: sysConf.orderPoints,
    odAvaDates: sysConf.odAvaDates
  })
  orderOptions.visible = false
}
async function onRecordExpanded(record: any) {
  if (mname.value === 'chamber') {
    const chamber = record as Chamber
    const orders = (await api.all('order', {
      copy: Order.copy,
      axiosConfig: { params: { _ext: true, fkChamber: chamber.key } }
    })) as Order[]
    console.log(orders)
    const options = recuJsonFuncs(orderStatus, {
      renderItem,
      orderStatusToChartData,
      dayjs,
      chamber,
      orders
    })
    console.log(options)
    echarts.init(document.getElementById(chamber.name)).setOption(options)
  }
}
function recuJsonFuncs(json: any, params: any) {
  for (const [key, value] of Object.entries(json)) {
    if (value instanceof Object) {
      json[key] = recuJsonFuncs(value, params)
    } else if (typeof value === 'string' && value.startsWith('return ')) {
      const func = new Function(...Object.keys(params), value)
      json[key] = func(...Object.values(params))
    }
  }
  return json
}
function allDates(year: number, month: number) {
  const monthMapper = Object.assign(
    {
      2: year % 4 ? 29 : 28
    },
    Object.fromEntries([1, 3, 5, 7, 8, 10, 12].map(i => [i, 31])),
    Object.fromEntries([4, 6, 9, 11].map(i => [i, 30]))
  )
  return Array.from({ length: monthMapper[month] }, (_, i) =>
    dayjs(new Date(year, month - 1, i + 1))
  )
}
function defaultSelDates(year: number, month: number) {
  return allDates(year, month)
    .map(date => (![0, 6].includes(date.day()) ? date.format('YYYY-M-D') : ''))
    .filter(str => str)
}
async function onDateTimeSelect() {
  await getSysConf()
  sysConf.orderPoints = sysConf.orderPoints
  const nowDate = dayjs()
  onMonthChange(nowDate.year(), nowDate.month() + 1)
  orderOptions.visible = true
}
function onMonthChange(year: number, month: number) {
  orderOptions.yearMonth = [year, month]
  const selDates = defaultSelDates(year, month)
  for (const date of allDates(year, month).map(date => date.format('YYYY-M-D'))) {
    if (sysConf.odAvaDates.includes(date) && !selDates.includes(date)) {
      selDates.push(date)
    } else if (sysConf.odAvaDates.includes('!' + date) && selDates.includes(date)) {
      selDates.splice(selDates.indexOf(date), 1)
    }
  }
  orderOptions.selDates.splice(0, orderOptions.selDates.length, ...selDates)
}
function onDateSelect(selDates: string[]) {
  const dftSelDates = defaultSelDates(...orderOptions.yearMonth)
  for (const date of allDates(...orderOptions.yearMonth).map(date => date.format('YYYY-M-D'))) {
    if (
      dftSelDates.includes(date) &&
      !selDates.includes(date) &&
      !sysConf.odAvaDates.includes('!' + date)
    ) {
      // 在默认日期中，但不在选中日期中，且与可预约日期冲突
      sysConf.odAvaDates.push('!' + date)
    } else if (
      !dftSelDates.includes(date) &&
      selDates.includes(date) &&
      !sysConf.odAvaDates.includes(date)
    ) {
      sysConf.odAvaDates.push(date)
    } else if (
      dftSelDates.includes(date) &&
      selDates.includes(date) &&
      sysConf.odAvaDates.includes('!' + date)
    ) {
      sysConf.odAvaDates.splice(sysConf.odAvaDates.indexOf('!' + date), 1)
    } else if (
      !dftSelDates.includes(date) &&
      !selDates.includes(date) &&
      sysConf.odAvaDates.includes(date)
    ) {
      sysConf.odAvaDates.splice(sysConf.odAvaDates.indexOf(date), 1)
    }
  }
}
function onOrderableSwitch(checked: boolean) {
  Modal.confirm({
    title: checked ? '是否开启预约服务？' : '确定关闭预约服务？',
    icon: createVNode(checked ? InfoCircleOutlined : ExclamationCircleOutlined),
    content: createVNode('div', { class: 'text-red-500' }, '开启关闭服务后客户端页面需要刷新'),
    onOk: () => api.update('config', sysConf.key, { orderOnOff: checked })
  })
}
function onOrderStartUse(order: Order) {
  updateOrderStatus(order.key, '进行中', '确定开始使用氧舱？', '请确保申请人已到并使用后再确认！')
}
async function onSchChamberClear() {
  emitter.emit('search', { fkChamber: '' })
  router.push(`/${project.name}/model/order`).then(refresh)
}
function onOrderCancel(order: Order) {
  updateOrderStatus(order.key, '已失效', '确定失效该订单？')
}
function updateOrderStatus(odKey: any, status: OrderStatus, title: string, content?: string) {
  Modal.confirm({
    title,
    icon: createVNode(ExclamationCircleOutlined),
    content: content ? createVNode('div', { class: 'text-red-500' }, content) : undefined,
    onOk: () =>
      api
        .update(
          'order',
          odKey,
          { status: `${status}|${dayjs().format(dtTmFmt)}` },
          { axiosConfig: { params: { _updMode: 'append' } } }
        )
        .then(refresh)
  })
}
function onOrderBefSave(order: Order) {
  if (mname.value === 'order') {
    order.status = [
      ...order.status.map(state => `${state[0]}|${state[1].format(dtTmFmt)}`),
      [order.state, dayjs().format(dtTmFmt)].join('|')
    ] as any
  }
}
</script>

<style>
.vc-calendar-day::before {
  padding-top: 30% !important;
}
.vc-day-selected::before {
  background: #1677ff !important;
}
.vc-calendar-tools-container {
  height: 60px !important;
}
.vc-calendar-week-head-container {
  height: 40px !important;
  padding-top: 20px !important;
}
.vc-calendar-prev {
  line-height: 60px !important;
  vertical-align: middle !important;
}
.vc-calendar-tools .vc-calendar-info {
  font-size: 32px !important;
}
.vc-calendar-next {
  line-height: 60px !important;
  vertical-align: middle !important;
}
.vc-calendar-dayoff.vc-day-selected .vc-calendar-date {
  color: white !important;
}
</style>
