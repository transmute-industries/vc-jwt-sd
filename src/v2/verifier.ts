
import Verifier from "../Verifier"

import digester from "./digester"
import JWS from "../JWS"

import Parse from "../Parse"

import { RequestV2Verifier,  V1VerifierConstructor } from '../types'

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