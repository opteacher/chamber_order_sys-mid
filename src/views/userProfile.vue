<template>
  <UserLayout>
    <a-descriptions title="用户信息" bordered :column="1">
      <template #extra>
        <div class="space-x-3">
          <a-button v-if="updateMod" @click="onUpdModCancel">取消</a-button>
          <a-button type="primary" :ghost="!updateMod" @click="onSwitchUpdMod">
            {{ updateMod ? '提交' : '修改' }}
          </a-button>
        </div>
      </template>
      <a-descriptions-item label="名字">
        <a-input v-if="updateMod" v-model:value="curUser.name" />
        <template v-else>{{ curUser.name }}</template>
      </a-descriptions-item>
      <!-- <a-descriptions-item label="密码">
        <a-input-password v-if="updateMod" v-model:value="password" />
        <template v-else>**********</template>
      </a-descriptions-item> -->
      <a-descriptions-item label="手机">
        <a-input v-if="updateMod" v-model:value="curUser.phone">
          <template #prefix>
            <PhoneOutlined />
          </template>
        </a-input>
        <template v-else>{{ curUser.phone }}</template>
      </a-descriptions-item>
      <a-descriptions-item label="单位">
        <a-select v-if="updateMod" class="w-full" v-model:value="curUser.unit" />
        <template v-else>{{ curUser.unit }}</template>
      </a-descriptions-item>
    </a-descriptions>
  </UserLayout>
</template>

<script setup lang="ts">
import UserLayout from '@/layouts/user.vue'
import User from '@/types/user'
import { onMounted, reactive, ref } from 'vue'
import lgnAPI from '@/apis/login'
import api from '@/apis/model'
import { PhoneOutlined } from '@ant-design/icons-vue'

const curUser = reactive<User>(new User())
const updateMod = ref(false)

onMounted(async () => {
  const { payload } = await lgnAPI.verify()
  console.log(await api.get('user', payload.sub))
  User.copy(await api.get('user', payload.sub), curUser)
})

async function onSwitchUpdMod() {
  if (updateMod.value) {
    await api.update('user', curUser.key, curUser, { ignores: ['key', 'role'] })
  }
  updateMod.value = !updateMod.value
}
function onUpdModCancel() {
  updateMod.value = false
}
</script>
