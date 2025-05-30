<template>
  <UserLayout>
    <div class="h-full flex flex-col">
      <a-divider class="border-slate-300">
        <a-badge :count="myOrders.filter(order => order.lastState !== '已失效').length">
          我的诊单
        </a-badge>
      </a-divider>
      <div class="flex-1 flex justify-center">
        <a-list class="flex-1 sm:w-[32rem]" item-layout="horizontal" :data-source="myOrders">
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
                  {{ item.odDtTm ? item.odDtTm.format('YYYY年MM月DD日') : 'invalid date' }}&nbsp;
                  {{ fmtDuration(item.duration) }}
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
    </div>
  </UserLayout>
</template>

<script setup lang="ts">
import UserLayout from '@/layouts/user.vue'
import lgnAPI from '@/apis/login'
import mdlAPI from '@/apis/model'
import Order, { OrderStatus, statusColor as orderStatColor } from '@/types/order'
import { createVNode, onMounted, reactive } from 'vue'
import User from '@/types/user'
import Chamber from '@/types/chamber'
import { sysConf, fmtDuration, dtTmFmt } from '@/utils'
import { Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

const myOrders = reactive<Order[]>([])

onMounted(refresh)

async function refresh() {
  const { payload } = await lgnAPI.verify()
  const user = (await mdlAPI.get('user', payload.sub, { copy: User.copy })) as User
  const doctor = (await mdlAPI.get('chamber', user.policeId, { copy: Chamber.copy })) as Chamber
  myOrders.splice(
    0,
    myOrders.length,
    ...(await Promise.all(
      doctor.orders.map(order => mdlAPI.get('order', order.key, { copy: Order.copy }))
    ))
  )
}
function onCancelOrder(order: Order) {
  Modal.confirm({
    title: '确定取消该预约？',
    icon: createVNode(ExclamationCircleOutlined),
    async onOk() {
      await mdlAPI.update(
        'order',
        order.key,
        {
          status: ['已失效', dayjs().format(dtTmFmt)].join('|')
        },
        { axiosConfig: { params: { _updMode: 'append' } } }
      )
      await mdlAPI.update('order', order.key, { lastState: '已失效' })
      await mdlAPI.update('chamber', order.fkChamber, { status: '运行中' })
      await refresh()
    }
  })
}
</script>
