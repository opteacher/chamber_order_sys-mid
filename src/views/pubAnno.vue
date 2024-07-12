<template>
  <MainLayout>
    <EditableTable
      :api="api.pubAnnos"
      :columns="columns"
      :mapper="mapper"
      :emitter="emitter"
      :new-fun="() => newOne(Anno)"
    >
      <template #pubDate="{ record }: any">
        {{ record.pubDate.format('YYYY年MM月DD日 HH时mm分ss秒') }}
      </template>
      <template #pubDateVW="{ current }: any">
        {{ current.pubDate.format('YYYY年MM月DD日 HH时mm分ss秒') }}
      </template>
    </EditableTable>
  </MainLayout>
</template>

<script lang="ts" setup>
import MainLayout from '@/layouts/main.vue'
import EditableTable from '@lib/components/EditableTable.vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { newOne } from '@lib/utils'
import Anno from '@/types/anno.ts'
import { TinyEmitter } from 'tiny-emitter'
import api from '@/apis/config'

const columns: Column[] = [
  new Column('正文', 'content'),
  new Column('发布日期', 'pubDate', { width: 40 })
]
const mapper = new Mapper({
  content: {
    label: '内容',
    type: 'Textarea',
    desc: '注意！请使用中文的标点符号，切勿使用英文符号，会导致公告丢失内容！！！'
  },
  pubDate: {
    label: '发布日期',
    type: 'DateTime'
  }
})
const emitter = new TinyEmitter()
</script>
