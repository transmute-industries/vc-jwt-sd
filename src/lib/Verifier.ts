
import { DIGEST_ALG_KEY } from "./constants";

import { VerifierCtx, RequestPresentationVerify, VerifiedSdJwt } from '../types'

import JWS from './JWS';
import Parse from './Parse';


import _unpack_disclosed_claims from './_unpack_disclosed_claims'
import { decodeJwt, decodeProtectedHeader } from "jose";

import { validate_public_claims } from './validate_public_claims'
import { validate_sd_hash } from './validate_sd_hash'

export default class Verifier {

  public debug: boolean;
  public alg: string;
  public digester;
  public verifier;
  public resolver;

  constructor(ctx: VerifierCtx) {
    this.alg = ctx.alg;
    this.digester = ctx.digester;
    this.verifier = ctx.verifier;
    this.resolver = ctx.resolver;
    this.debug = ctx.debug || false;
  }

  verify = async ({ presentation, aud, nonce }: RequestPresentationVerify) => {
    const { debug, verifier, resolver, digester } = this;
    const { jwt, kbt } = Parse.compact(presentation)
    const decodedHeader = decodeProtectedHeader(jwt)
    let verifiedIssuanceToken
    if (verifier) {
      verifiedIssuanceToken = await verifier.verify(presentation)
    } else if (resolver) {
      if (!decodedHeader.kid) {
        throw new Error('kid is required when resolver is used to obtain public keys')
      }
      const issuerPublicKey = await resolver.resolve(decodedHeader.kid)
      const compactJwsVerifier = await JWS.verifier(issuerPublicKey)
      verifiedIssuanceToken = await compactJwsVerifier.verify(jwt)
    } else {
      throw new Error('a verifier or resolver is required, but not present.')
    }
    if (verifiedIssuanceToken.claimset[DIGEST_ALG_KEY] !== digester.name) {
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
        let jkt;
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
        if ((verifiedIssuanceToken.claimset.cnf).jkt) {
          ({ cnf: { jkt } } = verifiedIssuanceToken.claimset)
          if (debug) {
            console.info('Issued JWT has JKT confirmation method.')
          }
          if (!resolver) {
            throw new Error('Resolver is required for jkt confirmation method')
          }
          confirmationPublicKey = await resolver?.resolve(jkt)
        }
        const compactJwsVerifier = await JWS.verifier(confirmationPublicKey)
        verified = await compactJwsVerifier.verify(kbt)
        if (!verified) {
          throw new Error('Failed to verify key binding token')
        }
        await validate_sd_hash(presentation, verified.claimset.sd_hash, debug)
        validate_public_claims('Key Binding Token', verified.claimset, {
          debug,
          reference_audience: aud,
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
    const { disclosureMap, hashToEncodedDisclosureMap } = await Parse.expload(presentation, { digester: digester })
    const state = { _hash_to_disclosure: hashToEncodedDisclosureMap, _hash_to_decoded_disclosure: disclosureMap }
    const output = _unpack_disclosed_claims(verifiedIssuanceToken.claimset, state)
    return JSON.parse(JSON.stringify({ protectedHeader: verifiedIssuanceToken.protectedHeader, claimset: output })) as VerifiedSdJwt
  }
}