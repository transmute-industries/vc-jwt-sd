
import Issuer from "../sd-jwt/Issuer"
import YAML from "../YAML-SD"
import digester from "./digester"
import salter from "./salter"
import JWS from "../sd-jwt/JWS"

import { RequestIssuer,  Salter,  Digester, Signer } from "../types"


const issuer = (options: RequestIssuer) => {
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
    issue: async ({ claimset, holder }: { claimset: string, holder?:any }) => {
      if (options.secretKeyJwk){
        options.signer = await JWS.signer(options.secretKeyJwk)
      }
      const role = new Issuer({
        alg: options.alg as string,
        iss: options.iss,
        kid: options.kid,
        typ: options.typ,
        cty: options.cty,
        salter: options.salter as Salter,
        digester: options.digester as Digester,
        signer: options.signer as Signer,
      })
      return role.issue({
        holder,
        claims: YAML.load(claimset)
      })
    }
  }
}

export default issuer