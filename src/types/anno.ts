import { gnlCpy } from "@lib/utils"
import dayjs, { Dayjs } from "dayjs"

export default class Anno {
  key: number
  content: string
  pubDate: Dayjs

  constructor() {
    this.key = -1
    this.content = ''
    this.pubDate = dayjs()
  }

  reset() {
    this.key = -1
    this.content = ''
    this.pubDate = dayjs()
  }

  static copy(src: any, tgt?: Anno, force = false): Anno {
    tgt = tgt || new Anno()
    if (typeof src === 'string') {
      const idxSep = src.indexOf('|')
      if (idxSep !== -1) {
        tgt.pubDate = dayjs(src.substring(0, idxSep), 'YYYY/MM/DD HH:mm:ss')
        tgt.content = src.substring(idxSep + 1)
      } else if (force) {
        tgt.reset()
      }
      return tgt
    } else {
      return gnlCpy(Anno, src, tgt, { force })
    }
  }
}