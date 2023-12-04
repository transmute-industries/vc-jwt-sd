
import Holder from "../lib/Holder"
import YAML from "../YAML-SD"
import digester from "./digester"
import salter from "./salter"
import JWS from "../lib/JWS"

import { RequestHolder, HolderCtx, PresentedCompactSdJwt } from "../types"

const holder = (options: RequestHolder = {}) => {
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
    issue: async ({ token, disclosure, audience, nonce }: { token: string, disclosure: string, audience ?: string, nonce ?: string }): Promise<PresentedCompactSdJwt> => {
      if (options.secretKeyJwk){
        options.signer = await JWS.signer(options.secretKeyJwk)
      }
      const role = new Holder(options as HolderCtx)
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