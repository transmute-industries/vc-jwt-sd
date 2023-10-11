
import Issuer from "../Issuer"
import YAML from "../YAML-SD"
import digester from "./digester"
import salter from "./salter"
import JWS from "../JWS"

import { SignParams } from "../types"

export type SdJwtSigner = {
  sign: ({protectedHeader, claimset}: SignParams)=> Promise<string>
}
export type SdJwtSalter = () => string
export type SdJwtDigester = {
  name: string
  digest: (json: string) => Promise<string>
}

export type RequestV2Issuer = { 
  alg?: string 
  iss?: string  
  kid?: string 
  typ?: string 
  cty?: string 
  digester?: SdJwtDigester  
  salter?: SdJwtSalter 
  signer?: SdJwtSigner
  secretKeyJwk?: any 
}

export type V1IssuerConstructor = { 
  alg: string 
  iss: string  
  digester: SdJwtDigester  
  salter: SdJwtSalter 
  signer: SdJwtSigner
}

const issuer = (options: RequestV2Issuer) => {
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
        salter: options.salter as SdJwtSalter,
        digester: options.digester as SdJwtDigester,
        signer: options.signer as SdJwtSigner,
      })
      return role.issue({
        holder,
        claims: YAML.load(claimset)
      })
    }
  }
}

export default issuer