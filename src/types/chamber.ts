import { gnlCpy } from "@lib/utils"

export const statusColor = {
  '运行中': 'processing',
  '已停止': 'default',
  '锁定': 'warning',
  '已预约': 'success',
  '异常': 'error'
}

export type ChamberStatus = keyof typeof statusColor

export default class Chamber {
  key: number
  name: string
  status: ChamberStatus

  constructor() {
    this.key = 0
    this.name = ''
    this.status = '已停止'
  }

  reset() {
    this.key = 0
    this.name = ''
    this.status = '已停止'
  }

  static copy(src: any, tgt?: Chamber, force = false): Chamber {
    return gnlCpy(Chamber, src, tgt, { force })
  }
}