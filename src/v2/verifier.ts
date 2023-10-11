
import Verifier from "../sd-jwt/Verifier"

import digester from "./digester"
import JWS from "../sd-jwt/JWS"

import Parse from "../sd-jwt/Parse"

import { PublicKeyJwk, RequestVerifier,  VerifierCtx } from '../types'

const verifier = (options: RequestVerifier) => {
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
        const verifier = await JWS.verifier(options.publicKeyJwk as PublicKeyJwk)
        return verifier.verify(parsed.jwt)
      }
    }
  }
  return {
    verify: async ({ token, audience, nonce }: { token: string, audience ?: string, nonce?: string }) => {
      
      const role = new Verifier(options as VerifierCtx)
      return role.verify({
        presentation: token,
        aud: audience,
        nonce: nonce
      })
    }
  }
}

export default verifier