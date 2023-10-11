import key from './key'
import salter from './salter'
import digester from './digester'

import issuer from './issuer'
import holder from './holder'
import verifier from './verifier'

import JWS from '../sd-jwt/JWS'

const v2 = { ...JWS, key, salter, digester, issuer, holder, verifier }

export default v2