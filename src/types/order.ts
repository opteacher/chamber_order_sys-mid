import dayjs, { Dayjs } from 'dayjs'
import Chamber from './chamber'
import User from './user'
import { gnlCpy } from '@lib/utils'

export const statusColor = {
  '未到时': 'success',
  '已失效': 'default',
  '已过期': 'error',
  '进行中': 'processing'
}

export type OrderStatus = keyof typeof statusColor

export default class Order {
  key: number
  fkChamber: number
  chamber?: Chamber
  odDtTm: Dayjs
  duration: number
  fkUser: number
  user?: User
  status: OrderStatus

  constructor() {
    this.key = 0
    this.fkChamber = 0
    this.odDtTm = dayjs()
    this.duration = 20
    this.fkUser = 0
    this.status = '未到时'
  }

  reset() {
    this.key = 0
    this.fkChamber = 0
    this.odDtTm = dayjs()
    this.duration = 20
    this.fkUser = 0
    this.status = '未到时'
  }

  static copy(src: any, tgt?: Order, force = false): Order {
    return gnlCpy(Order, src, tgt, {
      force,
      cpyMapper: { chamber: Chamber.copy, user: User.copy }
    })
  }
}
