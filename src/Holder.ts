import * as jose from "jose";

import { HolderCtx, RequestPresentation, SdHolderState } from "./types";

import { COMBINED_serialization_FORMAT_SEPARATOR, KB_JWT_TYP_HEADER } from "./constants";

import _select_disclosures from './_select_disclosures'

import Parse from "./Parse";


// SDJWTHolder
export default class Holder {
  public alg: string;
  public signer;
  public digester;

  constructor(ctx: HolderCtx) {
    this.alg = ctx.alg;
    this.digester = ctx.digester;
    this.signer = ctx.signer;
  }

  present = async ({ credential, disclosure, aud, nonce }: RequestPresentation) => {

    const parsed = Parse.compact(credential)
    // todo: verify
    const sd_jwt_payload = jose.decodeJwt(parsed.jwt);

    const config = { digester: this.digester }

    const {disclosureMap, hashToEncodedDisclosureMap} = await Parse.expload(credential, config)

    const state = {
      hs_disclosures: [],
      _hash_to_disclosure: hashToEncodedDisclosureMap, 
      _hash_to_decoded_disclosure: disclosureMap
    } as SdHolderState

    const parsedDisclosure = JSON.parse(JSON.stringify(disclosure, null, 2))

    // todo convert to a walk operation
    _select_disclosures(sd_jwt_payload, parsedDisclosure, state)
    // state now contains stuff.
    const disclosures = [...state.hs_disclosures] 

    if (sd_jwt_payload.cnf && (!aud || !nonce)){
      throw new Error('Credential does not contain confirmation method, therefore audience and nonce are not supported.')
    }
    if (aud && nonce){
      if (!sd_jwt_payload.cnf){
        throw new Error('Credential does not contain confirmation method, therefore audience and nonce are not supported.')
      }
      if (!this.signer){
        throw new Error('Signer is required.')
      }
      const kbt = await this.signer.sign({
        protectedHeader: { alg: this.alg, typ: KB_JWT_TYP_HEADER },
        claimset: {
          nonce,
          aud,
          iat: Math.floor(Date.now() / 1000)
        }
      })
      disclosures.push(kbt)
    }
    return parsed.jwt + COMBINED_serialization_FORMAT_SEPARATOR + disclosures.join(COMBINED_serialization_FORMAT_SEPARATOR)
  };
}
