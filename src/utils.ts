export * from '@lib/utils'
import { bsTpDefault } from '@lib/types'
import * as echarts from 'echarts'

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
