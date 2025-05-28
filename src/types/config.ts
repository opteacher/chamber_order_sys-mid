import { gnlCpy } from '@lib/utils'
import dayjs from 'dayjs'
import { sortBy } from 'lodash-es'

export default class Config {
  key: number
  orderPoints: number[]
  odAvaDates: string[]
  pubAnnos: string[]
  orderOnOff: boolean

  constructor() {
    this.key = 0
    this.orderPoints = Array.from({ length: 48 }, (_, i) => i / 2)
    this.odAvaDates = []
    this.pubAnnos = []
    this.orderOnOff = true
  }

  reset() {
    this.key = 0
    this.orderPoints = Array.from({ length: 48 }, (_, i) => i / 2)
    this.odAvaDates = []
    this.pubAnnos = []
    this.orderOnOff = true
  }

  static copy(src: any, tgt?: Config, force = false): Config {
    tgt = gnlCpy(Config, src, tgt, { force, ignProps: ['pubAnnos'] })
    if (src.pubAnnos) {
      tgt.pubAnnos = sortBy(
        src.pubAnnos.map((anno: string) => {
          const [sDate, content] = anno.split('|')
          return [dayjs(sDate, 'YYYY/MM/DD HH:mm:ss'), content]
        }),
        (item: any) => item[0]
      ).map((item: any) => item[1])
    } else if (force) {
      tgt.pubAnnos = []
    }
    return tgt
  }
}
