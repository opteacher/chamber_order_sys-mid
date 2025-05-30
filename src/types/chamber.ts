import { gnlCpy } from '@lib/utils'
import Order from './order'

export const statusColor = {
  运行中: 'processing',
  已停止: 'default',
  锁定: 'warning',
  已预约: 'success',
  异常: 'error'
}

export type ChamberStatus = keyof typeof statusColor

export default class Chamber {
  key: number
  name: string
  status: ChamberStatus
  orders: Order[]

  constructor() {
    this.key = 0
    this.name = ''
    this.status = '已停止'
    this.orders = []
  }

  reset() {
    this.key = 0
    this.name = ''
    this.status = '已停止'
    this.orders = []
  }

  static copy(src: any, tgt?: Chamber, force = false): Chamber {
    return gnlCpy(Chamber, src, tgt, { force, cpyMapper: { orders: Order.copy } })
  }
}
