
import Verifier from "../Verifier"
import YAML from "../YAML-SD"
import digester from "./digester"
import JWS from "../JWS"

import Parse from "../Parse"

export type SdJwtDigester = {
  name: string
  digest: (json: string) => Promise<string>
}

export type RequestV2Verifier = { 
  alg?: string
  digester?: SdJwtDigester
  verifier?: any
  publicKeyJwk?: any 
}

export type V1VerifierConstructor = { 
  alg: string
  digester: SdJwtDigester
  verifier: {
    verify: (token: string)=> Promise<any>
  }
}

const verifier = (options: RequestV2Verifier) => {
  if (options.publicKeyJwk){
    options.alg = options.publicKeyJwk.alg
  }
  if (!options.alg){
    throw new Error('alg must be passed as an option or restricted via publicKeyJwk')
  }
  if (!options.digester){
    options.digester = digester()
  }
  if (options.publicKeyJwk){
    options.verifier = {
      verify: async (token: string) => {
        const parsed = Parse.compact(token)
        const verifier = await JWS.verifier(options.publicKeyJwk)
        return verifier.verify(parsed.jwt)
      }
    }
  }
  return {
    verify: async ({ token, audience, nonce }: { token: string, audience ?: string, nonce?: string }) => {
      
      const role = new Verifier(options as V1VerifierConstructor)
      return role.verify({
        presentation: token,
        aud: audience,
        nonce: nonce
      })
    }
  }
}

export default verifier