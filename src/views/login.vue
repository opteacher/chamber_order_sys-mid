<template>
  <div
    class="px-5 py-12 h-full flex items-center bg-center bg-fixed bg-cover bg-no-repeat"
    :style="{
      'justify-content': lgnProps.align,
      'background-color': lgnProps.bkgdColor,
      'background-image': 'url(\'/src/assets/5c886206d1b40.jpg\')'
    }"
  >
    <div
      class="px-5 pt-4 max-w-xl"
      :style="{
        'border-radius': `${lgnProps.radius}px`,
        width: `${lgnProps.width}%`,
        'background-color': lgnProps.fmBkgdColor
      }"
    >
      <h1 class="text-2xl text-center mb-5">
        {{ lgnProps.title }}
      </h1>
      <a-form
        v-if="lgnMod"
        :model="formState"
        :label-col="{ span: lgnProps.hasLabel ? lgnProps.lblWidth : 0 }"
        :wrapper-col="{ span: lgnProps.hasLabel ? 24 - lgnProps.lblWidth : 24 }"
        @finish="onLogin"
      >
        <a-form-item label="公告">
          <OptSclPnl
            class="h-32"
            :toolbox="false"
            :line-wrapping="true"
            :line-numbers="true"
            :emitter="emitter"
          />
        </a-form-item>

        <FormItem
          v-for="(mapper, key) of lgnMapper"
          :key="key"
          :skey="key"
          :mapper="mapper"
          :form="formState"
          @update:fprop="(fm: any) => setProp(formState, key.toString(), fm[key])"
        />

        <a-form-item v-if="lgnProps.logAccount" name="remember">
          <a-checkbox v-model:checked="formState.remember">记住</a-checkbox>
        </a-form-item>

        <a-form-item>
          <template #label>
            <a-tooltip>
              <template #title>修复浏览器环境</template>
              <a-button type="text" @click="onFixBrowserClick">
                <template #icon><ToolOutlined /></template>
              </a-button>
            </a-tooltip>
          </template>
          <div class="text-center">
            <a-button type="primary" html-type="submit">登录</a-button>
            <template v-if="lgnProps.registerable">
              &nbsp;或&nbsp;
              <a href="#" @click="switchLgnMod">前往注册</a>
            </template>
          </div>
        </a-form-item>
      </a-form>
      <template v-else>
        <a-result
          v-if="regSucceed"
          status="success"
          title="用户注册成功！"
          sub-title="现在可以预约氧舱！"
        >
          <template #extra>
            <a-button type="primary" @click="() => onLogin(regFmState)">前往用户首页</a-button>
            <a-button @click="onToLoginClick">返回登录页面</a-button>
          </template>
        </a-result>
        <a-form
          v-else
          :model="regFmState"
          :label-col="{ span: lgnProps.hasLabel ? lgnProps.lblWidth : 0 }"
          :wrapper-col="{ span: lgnProps.hasLabel ? 24 - lgnProps.lblWidth : 24 }"
          @finish="onRegist"
        >
          <FormItem
            v-for="(mapper, key) of regMapper"
            :key="key"
            :skey="key"
            :mapper="mapper"
            :form="regFmState"
            @update:fprop="(fm: any) => setProp(regFmState, key.toString(), fm[key])"
          />

          <a-form-item>
            <div class="text-center">
              <a-button type="primary" html-type="submit">注册</a-button>
              &nbsp;已有账户&nbsp;
              <a href="#" @click="switchLgnMod">前往登录</a>
            </div>
            <template #label>
              <a-tooltip>
                <template #title>修复浏览器环境</template>
                <a-button type="text" @click="onFixBrowserClick">
                  <template #icon><ToolOutlined /></template>
                </a-button>
              </a-tooltip>
            </template>
          </a-form-item>
        </a-form>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MidLgn from '@/types/midLgn'
import Field from '@lib/types/field'
import { useRouter } from 'vue-router'
import api from '@/apis/login'
import mdlAPI from '@/apis/model'
import project from '@/jsons/project.json'
import models from '@/jsons/models.json'
import { createByFields } from '@lib/types/mapper'
import { pickOrIgnore, setProp } from '@lib/utils'
import { genDftFmProps } from '@/utils'
import { message, notification } from 'ant-design-vue'
import OptSclPnl from '@lib/components/OptSclPnl.vue'
import { TinyEmitter } from 'tiny-emitter'
import { ToolOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const lgnMod = ref(true)
const lgnProps = reactive(MidLgn.copy(project.middle.login))
const lgnMapper = createByFields(
  [
    { label: '登录名', ftype: 'Input', rules: [], refer: 'name', key: '663981121a109cf69d8f8071' },
    {
      label: '登录密码',
      ftype: 'Password',
      rules: [],
      refer: 'password',
      key: '663981211a109cf69d8f8108'
    }
  ].map((field: any) => {
    const ret = Field.copy(field)
    if (!lgnProps.hasLabel) {
      ret.label = ''
    }
    return ret
  }) as Field[]
)
const formState = reactive(Object.assign({ remember: true }, genDftFmProps(project.auth.props)))
const authMdl = Object.values(models).find(mdl => mdl._id === project.auth.model)
const regFmState = reactive(genDftFmProps(authMdl?.props || []))
const regMapper = createByFields(authMdl?.form.fields.map(field => Field.copy(field)) || [])
const regSucceed = ref(false)
const emitter = new TinyEmitter()

onMounted(async () => {
  if (localStorage.getItem('token')) {
    const result = await api.verifyDeep()
    if (result.error || !result.message) {
      notification.error({
        message: result.error || '未知错误，没有消息分量！'
      })
      return
    }
    if (result.message.endsWith('admin')) {
      router.replace(`/${project.name}/`)
    } else {
      router.replace(`/${project.name}/user_order`)
    }
  } else {
    emitter.emit(
      'message',
      '预约系统不接受节假日和休息日的预约单，即使下单成功也将被管理员取消，望周知。'
    )
  }
})

async function onLogin(values: any) {
  const result = await api.login(values)
  if (result.token && result.record) {
    localStorage.setItem('token', result.token)
    if (result.record.role === 'admin') {
      router.replace(`/${project.name}/`)
    } else {
      router.replace(`/${project.name}/user_order`)
    }
  }
}
async function onRegist(value: any) {
  if (!authMdl || !authMdl.name) {
    notification.error({
      message: '错误的权限模型!'
    })
    return
  }
  const fixVal = !value.policeId ? pickOrIgnore(value, ['policeId']) : value
  const result = await mdlAPI.add(
    authMdl?.name as string,
    { ...fixVal, role: 'user' },
    { type: 'api' }
  )
  if (result.error) {
    notification.error({
      message: '注册用户失败：' + result.error
    })
    return
  }
  console.log(result)
  regSucceed.value = true
}
function switchLgnMod() {
  lgnMod.value = !lgnMod.value
}
function onToLoginClick() {
  router.replace(`/${project.name}/login`)
  lgnMod.value = true
  regSucceed.value = false
}
function onFixBrowserClick() {
  localStorage.clear()
  message.success('修复成功！')
}
</script>
