import { gnlCpy } from "@lib/utils"

export default class Config {
  key: number
  orderPoints: number[]
  odAvaDates: string[]
  orderOnOff: boolean

  constructor() {
    this.key = 0
    this.orderPoints = Array.from({ length: 48 }, (_, i) => i / 2)
    this.odAvaDates = []
    this.orderOnOff = true
  }

  reset() {
    this.key = 0
    this.orderPoints = Array.from({ length: 48 }, (_, i) => i / 2)
    this.odAvaDates = []
    this.orderOnOff = true
  }

  static copy(src: any, tgt?: Config, force = false): Config {
    return gnlCpy(Config, src, tgt, { force })
  }
}