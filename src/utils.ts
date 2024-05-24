export * from '@lib/utils'
import { bsTpDefault } from '@lib/types'
import * as echarts from 'echarts'
import Order from './types/order'
import Config from './types/config'
import api from '@/apis/model'
import { reactive } from 'vue'

export function genDftFmProps(props: any[]) {
  const ret = {} as Record<string, any>
  for (const prop of props) {
    ret[prop.name] = bsTpDefault(prop.ptype)
  }
  return ret
}

export function renderItem(params: any, api: any) {
  const categoryIndex = api.value(0)
  const start = api.coord([api.value(1), categoryIndex])
  const end = api.coord([api.value(2), categoryIndex])
  const height = api.size([0, 1])[1] * 0.6
  const rectShape = echarts.graphic.clipRectByRect(
    {
      x: start[0],
      y: start[1] - height / 2,
      width: end[0] - start[0],
      height: height
    },
    {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height
    }
  )
  return (
    rectShape && {
      type: 'rect',
      transition: ['shape'],
      shape: rectShape,
      style: api.style()
    }
  )
}

const orderStatusColors = {
  未到时: '#faad14',
  已失效: 'rgba(0, 0, 0, 0.15)',
  已过期: '#f50',
  进行中: '#108ee9'
}

export function orderStatusToChartData(orders: Order[]) {
  const ret = []
  for (const order of orders) {
    const start = order.odDtTm.startOf('day').add(order.duration, 'hour')
    ret.push({
      name: order.lastState,
      value: [order.key, start.toDate(), start.add(0.5, 'minute').toDate(), 30],
      itemStyle: {
        color: orderStatusColors[order.lastState]
      }
    })
  }
  return ret
}

export function numToClock(num: number, range = false) {
  const fmtNum = Math.floor(num)
  const flag = num - fmtNum
  return (
    `${fmtNum.toString().padStart(2, '0')}:${flag ? '30' : '00'}` +
    (range
      ? ` ~ ${
          flag
            ? (fmtNum + 1).toString().padStart(2, '0') + ':00'
            : fmtNum.toString().padStart(2, '0') + ':30'
        }`
      : '')
  )
}

const transform = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
  9: '九',
  10: '十',
  11: '十一',
  12: '十二'
}

export function formatOfYearMonth(year: number, month: keyof typeof transform) {
  return [`${year}年`, `${transform[month]}月`]
}

export const dtTmFmt = 'YYYY/MM/DDTHH:mm:ss'

export const sysConf = reactive(new Config())

export async function getSysConf() {
  const result = await api.all('config', { copy: Config.copy })
  Config.copy(
    !result.length ? await api.add('config', sysConf, { copy: Config.copy }) : result[0],
    sysConf,
    true
  )
  return sysConf
}

export const dateFmt = 'YYYY-M-D'
