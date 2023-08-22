
import {  DIGEST_ALG_KEY } from "./constants";

import { VerifierCtx, RequestPresentationVerify, PublicKeyJwk } from './types'

import JWS from './JWS';
import Parse from './Parse';


import _unpack_disclosed_claims from './_unpack_disclosed_claims'

const acceptableAud = (expectedAud: string, receivedAud: string | string[]): boolean => {
  return Array.isArray(receivedAud) ? receivedAud.includes(expectedAud) : receivedAud === expectedAud
}

const verifyKbt = async (jwk:PublicKeyJwk, kbt:string, aud: string, nonce: string)=>{
  const holderVerifier = await JWS.verifier(jwk)
  const verifiedKeyBindingToken = await holderVerifier.verify(kbt)
  if (!acceptableAud(aud as string, verifiedKeyBindingToken.claimset.aud)){
    throw new Error('Audience does not match expected value: ' + aud)
  }
  if (nonce !== verifiedKeyBindingToken.claimset.nonce){
    throw new Error('Nonce does not match expected value: ' + nonce)
  }
}

export default class Verifier {

  public alg: string;
  public digester;
  public verifier;

  constructor(ctx: VerifierCtx) {
    this.alg = ctx.alg;
    this.digester = ctx.digester;
    this.verifier = ctx.verifier;
  }

  verify = async ({presentation, aud, nonce}: RequestPresentationVerify) => {
    const parsed = Parse.compact(presentation)
    const verifiedIssuanceToken = await this.verifier.verify(presentation)
    if (verifiedIssuanceToken.claimset[DIGEST_ALG_KEY] !== this.digester.name){
      throw new Error('Invalid hash algorithm')
    }
    if (verifiedIssuanceToken.claimset.cnf){
      if (!parsed.kbt){
        throw new Error('KBT required when cnf is present')
      }
      if (nonce || aud){
        try{
          const {cnf: {jwk}} = verifiedIssuanceToken.claimset as any
          await verifyKbt(jwk, parsed.kbt as string, aud as string, nonce as string)
        } catch(e){
          throw new Error('Failed to verify key binding token.')
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