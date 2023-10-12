
import Verifier from "../lib/Verifier"

import digester from "./digester"
import JWS from "../lib/JWS"

import Parse from "../lib/Parse"

import { PublicKeyJwk, RequestVerifier,  VerifierCtx } from '../types'

const verifier = (options: RequestVerifier) => {
  if (!options.digester){
    options.digester = digester()
  }
  if (options.publicKeyJwk){
    options.alg = options.alg || options.publicKeyJwk.alg
    if (!options.alg){
      throw new Error('alg must be passed as an option or restricted via publicKeyJwk')
    }
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