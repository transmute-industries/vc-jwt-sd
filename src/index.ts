

import Issuer from './Issuer'
import Holder from './Holder'
import Verifier from './Verifier'
import digester from './digester'
import JWK from './JWK'
import JWS from './JWS'
import Parse from './Parse'

import YAML from './YAML-SD'

const SD = { YAML, JWK, JWS, digester, Issuer, Holder, Verifier, Parse }

export default SD