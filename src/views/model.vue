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
    >
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
import { genDftFmProps } from '@/utils'
import Column from '@lib/types/column'
import Model from '@/types/bases/model'
import Table from '@/types/bases/table'
import dayjs from 'dayjs'
import Order from '@/types/order'

const route = useRoute()
const mname = ref<string>('')
const model = reactive<Model>(new Model())
const table = reactive<Table>(new Table())
const columns = ref<Column[]>([])
const emitter = new Emitter()

onMounted(refresh)
watch(() => route.params.mname, refresh)

function refresh() {
  mname.value = route.params.mname as string
  Model.copy((models as any)[mname.value], model)
  Table.copy(model.table, table)
  columns.value = table.columns.map((col: any) => Column.copy(col))
  emitter.emit('update:mapper', createByFields(model.form.fields))
  emitter.emit('refresh')
}
function onGetAll() {
  return api.all(
    mname.value,
    mname.value === 'order'
      ? { copy: Order.copy, axiosConfig: { params: { _ext: true } } }
      : undefined
  )
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
</script>
