export * from '@lib/utils'
import { bsTpDefault } from '@lib/types'

export function genDftFmProps(props: any[]) {
  const ret = {} as Record<string, any>
  for (const prop of props) {
    ret[prop.name] = bsTpDefault(prop.ptype)
  }
  return ret
}