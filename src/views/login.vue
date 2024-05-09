<template>
  <div
    class="px-5 py-12 h-full flex items-center"
    :style="{
      'justify-content': lgnProps.align,
      'background-color': lgnProps.bkgdColor,
      'background-image':
        'url(https://s.cn.bing.net/th?id=OHR.EmirganPark_ZH-CN3394557999_1920x1080.webp&qlt=50)'
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
          <a-button type="primary" html-type="submit">登录</a-button>
          <template v-if="lgnProps.registerable">
            &nbsp;或&nbsp;
            <a href="#" @click="switchLgnMod">前往注册</a>
          </template>
        </a-form-item>
      </a-form>
      <template v-else>
        <a-result
          v-if="regSucceed"
          status="success"
          title="用户注册成功！"
          sub-title="现可以预约氧舱！"
        >
          <template #extra>
            <a-button type="primary" @click="() => onLogin(regFmState)">前往用户首页</a-button>
            <a-button @click="() => router.replace(`/${project.name}/login`)">
              返回登录页面
            </a-button>
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
            <a-button type="primary" html-type="submit">注册</a-button>
            &nbsp;已有账户&nbsp;
            <a href="#" @click="switchLgnMod">前往登录</a>
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
import { setProp } from '@lib/utils'
import { genDftFmProps } from '@/utils'
import { notification } from 'ant-design-vue'

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

onMounted(async () => {
  if (localStorage.getItem('token')) {
    const result = await api.verifyDeep()
    console.log(result)
    if (!result.error) {
      router.replace(`/${project.name}/`)
    }
  }
})

async function onLogin(values: any) {
  const result = await api.login(values)
  if (result.token) {
    if (result.record.role === 'admin') {
      localStorage.setItem('token', result.token)
      router.push(`/${project.name}/`)
    } else {
      localStorage.setItem('userToken', result.token)
      router.push(`/${project.name}/userOrder`)
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
  const result = await mdlAPI.add(authMdl?.name as string, { ...value, role: 'user' })
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
</script>
