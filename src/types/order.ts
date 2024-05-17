import dayjs, { Dayjs } from 'dayjs'
import Chamber from './chamber'
import User from './user'
import { gnlCpy } from '@lib/utils'

export const statusColor = {
  未到时: 'warning',
  已失效: 'default',
  已过期: 'error',
  进行中: 'processing'
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
  status: [OrderStatus, Dayjs][]
  lastState: OrderStatus

  constructor() {
    this.key = 0
    this.fkChamber = 0
    this.odDtTm = dayjs()
    this.duration = 10
    this.fkUser = 0
    this.status = []
    this.lastState = '已失效'
  }

  reset() {
    this.key = 0
    this.fkChamber = 0
    this.odDtTm = dayjs()
    this.duration = 10
    this.fkUser = 0
    this.status = []
    this.lastState = '已失效'
  }

  static copy(src: any, tgt?: Order, force = false): Order {
    tgt = gnlCpy(Order, src, tgt, {
      force,
      ignProps: ['status'],
      cpyMapper: { chamber: Chamber.copy, user: User.copy }
    })
    if (src.status) {
      tgt.status = src.status.map((stt: string) => {
        const [strStt, strDtTm] = stt.split('|')
        return [strStt, dayjs(strDtTm)]
      })
    }
    return tgt
  }
}
