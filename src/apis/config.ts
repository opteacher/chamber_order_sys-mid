import Anno from '@/types/anno'
import { reqAll, reqPut, setProp } from '@lib/utils'

async function chgPubAnno(anno: Anno, updMode: 'cover' | 'append' | 'delete') {
  const configs = await reqAll('config')
  const { id: key } = configs.length ? configs[0] : { id: 0 }
  return reqPut(
    'config',
    key,
    {
      [`pubAnnos${anno.key !== -1 ? '[' + anno.key + ']' : ''}`]: [
        anno.pubDate.format('YYYY/MM/DD HH:mm:ss'),
        anno.content
      ].join('|')
    },
    { axiosConfig: { params: { _updMode: updMode } } }
  )
}

export default {
  pubAnnos: {
    all: async () => {
      const configs = await reqAll('config')
      const { pubAnnos } = configs.length ? configs[0] : { pubAnnos: [] }
      return pubAnnos.map((anno: any, index: number) => setProp(Anno.copy(anno), 'key', index))
    },
    add: (anno: Anno) => chgPubAnno(anno, 'append'),
    update: (anno: Anno) => chgPubAnno(anno, 'cover'),
    remove: (anno: Anno) => chgPubAnno(anno, 'delete')
  }
}
