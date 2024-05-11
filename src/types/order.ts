import dayjs, { Dayjs } from 'dayjs'
import Chamber from './chamber'
import User from './user'
import { gnlCpy } from '@lib/utils'

export type OrderStatus = '未到时' | '已过期' | '进行中' | '已失效'

export default class Order {
  key: number
  chambers: Chamber | string
  odDtTm: Dayjs
  duration: number
  users: User | string
  status: OrderStatus

  constructor() {
    this.key = 0
    this.chambers = ''
    this.odDtTm = dayjs()
    this.duration = 20
    this.users = ''
    this.status = '未到时'
  }

  reset() {
    this.key = 0
    this.chambers = ''
    this.odDtTm = dayjs()
    this.duration = 20
    this.users = ''
    this.status = '未到时'
  }

  static copy(src: any, tgt?: Order, force = false): Order {
    return gnlCpy(Order, src, tgt, {
      force,
      cpyMapper: { chambers: Chamber.copy, users: User.copy }
    })
  }
}
