

import Issuer from './Issuer'
import Holder from './Holder'
import Verifier from './Verifier'
import JWK from './JWK'
import JWS from './JWS'
import Parse from './Parse'

import YAML from './YAML-SD'

import web from './web'

import * as v2 from './SD-CWT'

const SD = { v2, web, YAML, JWK, JWS, Issuer, Holder, Verifier, Parse }

export default SD