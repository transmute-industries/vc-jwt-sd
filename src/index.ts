


import JWK from './lib/JWK'
import JWS from './lib/JWS'
import Parse from './lib/Parse'

import YAML from './YAML-SD'

import v2 from './v2'

export * from './types'

const sd = { ...v2, YAML, JWK, JWS, Parse }

export default sd