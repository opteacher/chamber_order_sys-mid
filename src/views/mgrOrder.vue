<template>
  <UserLayout>
    <div class="h-full flex flex-col">
      <a-divider class="border-slate-300">
        <a-radio-group value="myOrders" button-style="solid">
          <a-badge :count="myOrders.filter(order => order.lastState !== '已失效').length">
            <a-radio-button class="border-l-0 rounded-l-none rounded-r-md" value="myOrders">
              我的诊单
            </a-radio-button>
          </a-badge>
        </a-radio-group>
      </a-divider>
    </div>
  </UserLayout>
</template>

<script setup lang="ts">
import UserLayout from '@/layouts/user.vue'
import Order from '@/types/order'
import { reactive } from 'vue'

const myOrders = reactive<Order[]>([])
</script>
