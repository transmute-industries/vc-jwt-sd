
import {  DIGEST_ALG_KEY } from "./constants";

import { VerifierCtx, RequestPresentationVerify, PublicKeyJwk } from '../types'

import JWS from './JWS';
import Parse from './Parse';


import _unpack_disclosed_claims from './_unpack_disclosed_claims'
import { decodeProtectedHeader } from "jose";

const acceptableAud = (expectedAud: string, receivedAud: string | string[]): boolean => {
  return Array.isArray(receivedAud) ? receivedAud.includes(expectedAud) : receivedAud === expectedAud
}


// fix me here....
const validateVerifiedKbt = ({ claimset, audience, nonce }: { claimset: Record<string, unknown> & { aud: string}, audience: string, nonce: string })=>{
  if (!acceptableAud(audience as string, claimset.aud)){
    throw new Error('Audience does not match expected value: ' + audience)
  }
  if (nonce !== claimset.nonce){
    throw new Error('Nonce does not match expected value: ' + nonce)
  }
}

export default class Verifier {

  public alg: string;
  public digester;
  public verifier;
  public resolver;

  constructor(ctx: VerifierCtx) {
    this.alg = ctx.alg;
    this.digester = ctx.digester;
    this.verifier = ctx.verifier;
    this.resolver = ctx.resolver;
  }

  verify = async ({presentation, aud, nonce}: RequestPresentationVerify) => {
    const parsed = Parse.compact(presentation)
    const decodedHeader = decodeProtectedHeader(parsed.jwt)
    let verifiedIssuanceToken
    if (this.verifier){
      verifiedIssuanceToken = await this.verifier.verify(presentation)
    } else if (this.resolver){
      if (!decodedHeader.kid){
        throw new Error('kid is required when resolver is used to obtain public keys')
      }
      const issuerPublicKey = await this.resolver.resolve(decodedHeader.kid)
      const compactJwsVerifier = await JWS.verifier(issuerPublicKey)
      verifiedIssuanceToken = await compactJwsVerifier.verify(parsed.jwt)
    } else {
      throw new Error('a verifier or resolver is required, but not present.')
    }
   
    if (verifiedIssuanceToken.claimset[DIGEST_ALG_KEY] !== this.digester.name){
      throw new Error('Invalid hash algorithm')
    }
    if (verifiedIssuanceToken.claimset.cnf){
      if (!parsed.kbt){
        throw new Error('Verification of this credential requires proof of posession from the holder. Key binding token is expected based on claims, but was not found.')
      }
      if (nonce || aud){
        try {
          let jkt;
          let jwk;
          let confirmationPublicKey
          let verified;
          // todo: refactor me so validation is consistent
          if ((verifiedIssuanceToken.claimset.cnf as any).jwk ){
            ({cnf: {jwk}} = verifiedIssuanceToken.claimset  as any)
            confirmationPublicKey = jwk
          } if ((verifiedIssuanceToken.claimset.cnf as any).jkt ){
            ({cnf: {jkt}} = verifiedIssuanceToken.claimset  as any)
            // jkt -> jwk
            // but we know this will also work
            if (!this.resolver){
              throw new Error('Resolver is required for jkt confirmation method')
            }
            confirmationPublicKey = await this.resolver?.resolve(jkt)
          }
          const compactJwsVerifier = await JWS.verifier(confirmationPublicKey)
          verified = await compactJwsVerifier.verify(parsed.kbt)
          if (!verified){
            throw new Error('Failed to verify key binding token')
          }

          validateVerifiedKbt({claimset: verified?.claimset as any, audience: aud as any, nonce: nonce as any})

        } catch(e){
          console.log(e)
          throw new Error('Failed to validate key binding token.')
        }
      }
    }
    const config = { digester: this.digester }
    const {disclosureMap, hashToEncodedDisclosureMap} = await Parse.expload(presentation, config)
    const state = { _hash_to_disclosure: hashToEncodedDisclosureMap, _hash_to_decoded_disclosure: disclosureMap }
    const output = _unpack_disclosed_claims(verifiedIssuanceToken.claimset, state)
    return JSON.parse(JSON.stringify({protectedHeader: verifiedIssuanceToken.protectedHeader, claimset: output}))
  }
}