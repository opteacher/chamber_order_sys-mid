import { gnlCpy } from "@lib/utils"

export default class Config {
  key: number
  orderPoints: number[]

  constructor() {
    this.key = 0
    this.orderPoints = Array.from({ length: 24 }, (_, i) => i)
  }

  reset() {
    this.key = 0
    this.orderPoints = Array.from({ length: 24 }, (_, i) => i)
  }

  static copy(src: any, tgt?: Config, force = false): Config {
    return gnlCpy(Config, src, tgt, { force })
  }
}