

import Issuer from './sd-jwt/Issuer'
import Holder from './sd-jwt/Holder'
import Verifier from './sd-jwt/Verifier'
import JWK from './sd-jwt/JWK'
import JWS from './sd-jwt/JWS'
import Parse from './sd-jwt/Parse'

import YAML from './YAML-SD'

import v2 from './v2'

const sd = { ...v2, YAML, JWK, JWS, Issuer, Holder, Verifier, Parse }

export default sd