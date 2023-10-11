
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
      const role = new Issuer(options as V1IssuerConstructor)
      return role.issue({
        holder,
        claims: YAML.load(claimset)
      })
    }
  }
}

export default issuer