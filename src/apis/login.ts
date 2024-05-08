import { reqPost } from '@lib/utils'

export default {
  login: (data: any) =>
    reqPost('user/sign', data, {
      type: 'api',
      ignores: ['remember'],
      messages: { succeed: '' }
    }),
  verify: () => reqPost('user/verify', undefined, { type: 'api'}),
  verifyDeep: () => reqPost('user/verify/deep', undefined, { type: 'api'})
}