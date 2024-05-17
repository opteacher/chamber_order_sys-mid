<template>
  <a-tooltip>
    <template v-if="hasOrder" #title>该天有预约单</template>
    <div
      class="ant-picker-cell-inner"
      :class="{
        'border border-solid border-[#faad14]': hasOrder
      }"
    >
      {{ current.date() }}
    </div>
  </a-tooltip>
</template>

<script setup lang="ts">
import { Dayjs } from 'dayjs'
import { PropType } from 'vue'

defineProps({
  hasOrder: { type: Boolean, default: false },
  current: { type: Object as PropType<Dayjs>, required: true }
})
</script>
