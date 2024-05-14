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
      :editable="table.operable.includes('可编辑')"
      :addable="table.operable.includes('可增加')"
      :delable="table.operable.includes('可删除')"
      @expand="onRecordExpanded"
    >
      <template v-if="mname === 'order'" #extra>
        <a-button @click="() => setProp(orderOptions, 'pointsVisible', true)">选择时间段</a-button>
        <a-modal
          title="可预约时刻点"
          width="30vw"
          v-model:open="orderOptions.pointsVisible"
          @ok="onOrderPointsSubmit"
        >
          <a-row class="mt-5" :gutter="8">
            <a-col
              v-for="idx of Array.from({ length: 24 }, (_, i) => i)"
              :key="idx"
              class="mb-3"
              :span="3"
            >
              <a-button
                class="w-full"
                :type="orderOptions.points.includes(idx) ? 'primary' : 'default'"
                @click="() => onOrderTmPointClick(idx)"
              >
                {{ idx.toString().padStart(2, '0') }}
              </a-button>
            </a-col>
          </a-row>
        </a-modal>
      </template>
      <template #odDtTm="{ record }">
        {{ dayjs(record.odDtTm).format('YYYY/MM/DD HH:mm:ss') }}
      </template>
      <template #fkChamber="{ record }">
        {{ record.chamber ? record.chamber.name : '-' }}
      </template>
      <template #fkUser="{ record }">
        {{ record.user ? `${record.user.name} / ${record.user.phone}` : '-' }}
      </template>
      <template #duration="{ record }">{{ record.duration }}分钟</template>
      <template v-if="mname === 'chamber'" #expandedRowRender="{ record }">
        <div :id="record.name" class="w-full h-48" />
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
import { genDftFmProps, renderItem, setProp } from '@/utils'
import Column from '@lib/types/column'
import Model from '@/types/bases/model'
import Table from '@/types/bases/table'
import dayjs from 'dayjs'
import Order from '@/types/order'
import Config from '@/types/config'
import _ from 'lodash'
import Chamber from '@/types/chamber'
import User from '@/types/user'
import orderStatus from '@/jsons/orderStatus.json'
import * as echarts from 'echarts'

const route = useRoute()
const mname = ref<string>('')
const model = reactive<Model>(new Model())
const table = reactive<Table>(new Table())
const columns = ref<Column[]>([])
const emitter = new Emitter()
const orderOptions = reactive({
  pointsVisible: false,
  points: [] as number[],
  cfgKey: 0
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
      dayjs,
      chamber,
      orders,
      statusColor: {
        未到时: '#87d068',
        已失效: 'rgb(0 0 0 / 88%)',
        已过期: '#f50',
        进行中: '#108ee9'
      }
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
</script>
