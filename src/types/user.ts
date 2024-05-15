import { gnlCpy } from "@lib/utils"

export default class User {
  key: number
  name: string
  policeId: string
  phone: string
  role: string
  unit: string

  constructor() {
    this.key = 0
    this.name = ''
    this.policeId = ''
    this.phone = ''
    this.role = ''
    this.unit = ''
  }
  reset() {
    this.key = 0
    this.name = ''
    this.policeId = ''
    this.phone = ''
    this.role = ''
    this.unit = ''
  }

  static copy(src: any, tgt?: User, force = false): User {
    return gnlCpy(User, src, tgt, { force })
  }
}