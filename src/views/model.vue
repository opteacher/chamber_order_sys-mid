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
      :columns="columns"
      :new-fun="() => genDftFmProps(model.props)"
      :emitter="emitter"
      :size="table.size"
      :pagable="table.hasPages"
      :refOptions="table.refresh"
      :dspCols="table.colDspable"
      :imExport="table.imExport"
      :editable="table.operable.includes('可编辑')"
      :addable="table.operable.includes('可增加')"
      :delable="table.operable.includes('可删除')"
      @expand="onRecordExpanded"
    >
      <template v-if="mname === 'order'" #extra>
        <a-button @click="() => setProp(orderOptions, 'pointsVisible', true)">选择时间段</a-button>
        <a-modal
          title="可预约时间"
          width="50vw"
          v-model:open="orderOptions.pointsVisible"
          @ok="onOrderPointsSubmit"
        >
          <a-form layout="vertical">
            <a-form-item label="可预约日期">
              <MpvueCalendar
                class="w-full"
                select-mode="multi"
                :use-swipe="false"
                v-model:select-date="orderOptions.avaDates"
                @onMonthChange="onMonthChange"
              />
            </a-form-item>
            <a-form-item label="可预约时刻">
              <a-row class="mt-5" :gutter="8">
                <a-col
                  v-for="idx of Array.from({ length: 48 }, (_, i) => i / 2)"
                  :key="idx"
                  class="mb-3"
                  :span="3"
                >
                  <a-button
                    class="w-full"
                    :type="orderOptions.points.includes(idx) ? 'primary' : 'default'"
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
      <template #odDtTm="{ record }">
        {{ dayjs(record.odDtTm).format('YYYY/MM/DD') }}
      </template>
      <template #fkChamber="{ record }">
        {{ record.chamber ? record.chamber.name : '-' }}
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
        {{ getOrderCurStatus(record) || '-' }}
      </template>
      <template #operOrder="{ record }">
        <div class="flex space-x-2">
          <a-button type="primary" ghost size="small" @click.stop="">开始使用</a-button>
          <a-button type="primary" ghost size="small" @click.stop="" danger>失效</a-button>
        </div>
      </template>
      <template #detail="{ record }">
        <a-button type="primary" ghost size="small">查看预约单</a-button>
      </template>
    </EditableTable>
  </MainLayout>
</template>

<script setup lang="ts">
import { watch, ref, onMounted, reactive } from 'vue'
import MainLayout from '@/layouts/main.vue'
import models from '@/jsons/models.json'
import { useRoute } from 'vue-router'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { createByFields } from '@lib/types/mapper'
import api from '@/apis/model'
import {
  genDftFmProps,
  renderItem,
  setProp,
  getOrderCurStatus,
  orderStatusToChartData,
  numToClock
} from '@/utils'
import Column from '@lib/types/column'
import Model from '@/types/bases/model'
import Table from '@/types/bases/table'
import dayjs from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import Order from '@/types/order'
import Config from '@/types/config'
import _ from 'lodash'
import Chamber from '@/types/chamber'
import User from '@/types/user'
import orderStatus from '@/jsons/orderStatus.json'
import * as echarts from 'echarts'
import 'dayjs/locale/zh-cn'
import MpvueCalendar from 'mpvue-calendar'

dayjs.locale('zh-cn')
dayjs.extend(minMax)

const route = useRoute()
const mname = ref<string>('')
const model = reactive<Model>(new Model())
const table = reactive<Table>(new Table())
const columns = ref<Column[]>([])
const emitter = new Emitter()
const orderOptions = reactive({
  pointsVisible: false,
  points: [] as number[],
  cfgKey: 0,
  avaDates: [] as string[]
})
const copies = {
  chamber: Chamber.copy,
  order: Order.copy,
  user: User.copy
} as any

onMounted(refresh)
watch(() => route.params.mname, refresh)
watch(
  () => orderOptions.pointsVisible,
  async () => {
    if (orderOptions.pointsVisible) {
      let sysConf = new Config()
      const result = await api.all('config', { copy: Config.copy })
      if (!result.length) {
        orderOptions.cfgKey = await api
          .add('config', sysConf, { copy: Config.copy })
          .then(res => res.key)
      } else {
        Config.copy(result[0], sysConf, true)
        orderOptions.cfgKey = result[0].key
      }
      orderOptions.points = sysConf.orderPoints
      const nowDate = dayjs()
      onMonthChange(nowDate.year(), nowDate.month() + 1)
    }
  }
)

function refresh() {
  mname.value = route.params.mname as string
  Model.copy((models as any)[mname.value], model)
  Table.copy(model.table, table)
  columns.value = table.columns.map((col: any) => Column.copy(col))
  emitter.emit('update:mapper', createByFields(model.form.fields))
  emitter.emit('refresh')
}
function onGetAll() {
  return api.all(mname.value, {
    copy: copies[mname.value],
    axiosConfig: { params: { _ext: true } }
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
  console.log(record)
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
  if (orderOptions.points.includes(idx)) {
    _.remove(orderOptions.points, i => i === idx)
  } else {
    orderOptions.points.push(idx)
  }
}
async function onOrderPointsSubmit() {
  console.log(orderOptions.avaDates)
  await api.update('config', orderOptions.cfgKey, { orderPoints: orderOptions.points })
  orderOptions.pointsVisible = false
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
function onMonthChange(year: number, month: number) {
  const monthMapper = Object.assign(
    {
      2: year % 4 ? 29 : 28
    },
    Object.fromEntries([1, 3, 5, 7, 8, 10, 12].map(i => [i, 31])),
    Object.fromEntries([4, 6, 9, 11].map(i => [i, 30]))
  )
  orderOptions.avaDates.splice(
    0,
    orderOptions.avaDates.length,
    ...Array.from({ length: monthMapper[month] }, (_, i) => {
      const date = dayjs(new Date(year, month - 1, i + 1))
      return ![0, 6].includes(date.day()) ? date.format('YYYY-M-D') : ''
    }).filter(str => str)
  )
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
