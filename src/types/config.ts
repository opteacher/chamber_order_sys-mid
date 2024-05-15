import { gnlCpy } from "@lib/utils"

export default class Config {
  key: number
  orderPoints: number[]

  constructor() {
    this.key = 0
    this.orderPoints = Array.from({ length: 48 }, (_, i) => i / 2)
  }

  reset() {
    this.key = 0
    this.orderPoints = Array.from({ length: 48 }, (_, i) => i / 2)
  }

  static copy(src: any, tgt?: Config, force = false): Config {
    return gnlCpy(Config, src, tgt, { force })
  }
}