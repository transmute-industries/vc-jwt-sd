
import Verifier from "../lib/Verifier"

import digester from "./digester"
import JWS from "../lib/JWS"

import Parse from "../lib/Parse"

import { PublicKeyJwk, RequestVerifier,  VerifierCtx, VerifiedSdJwt } from '../types'

export default function verifier<T=VerifiedSdJwt>(options: RequestVerifier){
  if (!options.digester){
    options.digester = digester()
  }
  if (options.publicKeyJwk){
    const { publicKeyJwk } = options
    options.alg = options.alg || publicKeyJwk.alg
    if (!options.alg){
      throw new Error('alg must be passed as an option or restricted via publicKeyJwk')
    }
    options.verifier = {
      verify: async (token: string) => {
        const { jwt } = Parse.compact(token)
        const verifier = await JWS.verifier(publicKeyJwk as PublicKeyJwk)
        return verifier.verify(jwt)
      }
    }
  }
  return {
    verify: async ({ token, audience, nonce }: { token: string, audience ?: string, nonce?: string }): Promise<T> => {
      const role = new Verifier(options as VerifierCtx)
      const verified = await role.verify({
        presentation: token,
        aud: audience,
        nonce: nonce
      })
      return verified as T
    }
  }
}

