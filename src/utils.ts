export * from '@lib/utils'
import { bsTpDefault } from '@lib/types'
import * as echarts from 'echarts'
import Order from './types/order'

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

export function getOrderCurStatus(order: Order) {
  return order.status.length ? order.status[order.status.length - 1][0] : ''
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
    for (let i = 0; i < order.status.length; ++i) {
      const state = order.status[i]
      console.log(state)
      ret.push({
        name: state[0],
        value: [
          order.key,
          state[1].add(order.duration, 'hour').toDate(),
          i !== order.status.length - 1
            ? order.status[i + 1][1].toDate()
            : state[1].add(10, 'minute')
        ],
        itemStyle: {
          color: orderStatusColors[state[0]]
        }
      })
    }
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
