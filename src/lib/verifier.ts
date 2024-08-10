
import digester from "./digester"
import jws from "./JWS"

import parse from "./Parse"

import { PublicKeyJwk, RequestVerifier, VerifiedSdJwt } from '../types'

import { DIGEST_ALG_KEY } from "./constants";

import _unpack_disclosed_claims from './_unpack_disclosed_claims'
import {  decodeProtectedHeader } from "jose";

import { validate_public_claims } from './validate_public_claims'
import { validate_sd_hash } from './validate_sd_hash'

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
        const { jwt } = parse.compact(token)
        const verifier = await jws.verifier(publicKeyJwk as PublicKeyJwk)
        return verifier.verify(jwt)
      }
    }
  }
  return {
    verify: async ({ token, audience, nonce }: { token: string, audience ?: string, nonce?: string }): Promise<T> => {
      const debug = false
      const { jwt, kbt } = parse.compact(token)
      const decodedHeader = decodeProtectedHeader(jwt)
      let verifiedIssuanceToken
      if ( options.verifier) {
        verifiedIssuanceToken = await options.verifier.verify(token)
      } else if (options.resolver) {
        if (!decodedHeader.kid) {
          throw new Error('kid is required when resolver is used to obtain public keys')
        }
        const issuerPublicKey = await options.resolver.resolve(decodedHeader.kid)
        const compactJwsVerifier = await jws.verifier(issuerPublicKey)
        verifiedIssuanceToken = await compactJwsVerifier.verify(jwt)
      } else {
        throw new Error('a verifier or resolver is required, but not present.')
      }
      if (!options.digester){
        throw new Error('digester is required')
      }
      if (verifiedIssuanceToken.claimset[DIGEST_ALG_KEY] !== options.digester.name) {
        throw new Error('Invalid hash algorithm')
      }
      // here we are verifying the "Issuer Signed JWT"
      // aud and nonce, are expected to be checked in the KBT, not the "Issuer Signed JWT".
      // See: https://github.com/oauth-wg/oauth-selective-disclosure-jwt/issues/395
      validate_public_claims('Issuer-signed JWT', verifiedIssuanceToken.claimset, { 
        debug, 
        reference_audience: verifiedIssuanceToken.claimset.aud, 
        reference_nonce: verifiedIssuanceToken.claimset.nonce 
      })
      if (debug) {
        console.info('Verified Issuer-signed JWT: ', JSON.stringify(verifiedIssuanceToken, null, 2))
      }
      const { cnf } = verifiedIssuanceToken.claimset
      if (cnf) {
        if (!kbt) {
          throw new Error('Verification of this credential requires proof of posession from the holder. Key binding token is expected based on claims, but was not found.')
        }
        try {
          let kid;
          let jwk;
          let confirmationPublicKey
          let verified;
          const { cnf } = verifiedIssuanceToken.claimset
          if (cnf.jwk) {
            ({ cnf: { jwk } } = verifiedIssuanceToken.claimset)
            confirmationPublicKey = jwk
            if (debug) {
              console.info('Issued JWT has JWK confirmation method.')
            }
          }
          if ((verifiedIssuanceToken.claimset.cnf).kid) {
            ({ cnf: { kid } } = verifiedIssuanceToken.claimset)
            if (debug) {
              console.info('Issued JWT has kid confirmation method.')
            }
            if (!options.resolver) {
              throw new Error('Resolver is required for kid confirmation method')
            }
            confirmationPublicKey = await options.resolver?.resolve(kid)
          }
          const compactJwsVerifier = await jws.verifier(confirmationPublicKey)
          verified = await compactJwsVerifier.verify(kbt)
          if (!verified) {
            throw new Error('Failed to verify key binding token')
          }
          await validate_sd_hash(token, verified.claimset.sd_hash, debug)
          validate_public_claims('Key Binding Token', verified.claimset, {
            debug,
            reference_audience: audience,
            reference_nonce: nonce
          })
          if (debug) {
            console.info('Verified Key Binding Token: ', JSON.stringify(verified, null, 2))
          }
        } catch (e) {
          console.error(e)
          throw new Error('Failed to validate key binding token.')
        }
      } else {
        if (debug) {
          console.info('Issued JWT has no confirmation method.')
        }
      }
      const { disclosureMap, hashToEncodedDisclosureMap } = await parse.expload(token, options)
      const state = { _hash_to_disclosure: hashToEncodedDisclosureMap, _hash_to_decoded_disclosure: disclosureMap }
      const output = _unpack_disclosed_claims(verifiedIssuanceToken.claimset, state)
      const verified = JSON.parse(JSON.stringify({ protectedHeader: verifiedIssuanceToken.protectedHeader, claimset: output })) as VerifiedSdJwt
      return verified as T
    }
  }
}

