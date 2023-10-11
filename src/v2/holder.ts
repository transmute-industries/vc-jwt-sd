
import Holder from "../sd-jwt/Holder"
import YAML from "../YAML-SD"
import digester from "./digester"
import salter from "./salter"
import JWS from "../sd-jwt/JWS"

import { RequestV2Holder, V1HolderConstructor } from "../types"

const holder = (options: RequestV2Holder = {}) => {
  if (options.secretKeyJwk){
    options.alg = options.secretKeyJwk.alg
  }
  if (!options.digester){
    options.digester = digester()
  }
  if (!options.salter){
    options.salter = salter()
  }
  if (!options.alg && options.signer){
    throw new Error('alg must be passed as an option or restricted via secretKeyJwk')
  }
  return {
    issue: async ({ token, disclosure, audience, nonce }: { token: string, disclosure: string, audience ?: string, nonce ?: string }) => {
      if (options.secretKeyJwk){
        options.signer = await JWS.signer(options.secretKeyJwk)
      }
      const role = new Holder(options as V1HolderConstructor)
      return role.present({
        credential: token,
        disclosure: YAML.load(disclosure),
        aud: audience,
        nonce: nonce
      })
    }
  }
}

export default holder