
import moment from 'moment';
import * as jose from "jose";
import {  SdHolderState, PresentedCompactSdJwt } from "../types";
import { COMBINED_serialization_FORMAT_SEPARATOR, KB_JWT_TYP_HEADER } from "./constants";
import _select_disclosures from './_select_disclosures'
import Parse from "./Parse";
import { sortProtectedHeader } from './sortProtectedHeader'
import { sd_hash } from "./sd_hash";

export const _present = async ({ alg, iss, kid, digester, signer, credential, disclosure, aud, nonce }: any) => {
  const iat = moment().unix()
  const parsed = Parse.compact(credential)
  // todo: verify
  const sd_jwt_payload = jose.decodeJwt(parsed.jwt);
  const { disclosureMap, hashToEncodedDisclosureMap } = await Parse.expload(credential, { digester })
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
    throw new Error('Credential requires confirmation but audience and nonce are missing.')
  }
  let presented_token = parsed.jwt;
  if (disclosures.length){
    presented_token += COMBINED_serialization_FORMAT_SEPARATOR + disclosures.join(COMBINED_serialization_FORMAT_SEPARATOR)
  }
  presented_token += COMBINED_serialization_FORMAT_SEPARATOR
  if (aud && nonce){
    if (!sd_jwt_payload.cnf){
      throw new Error('Credential does not contain confirmation method, therefore audience and nonce are not supported.')
    }
    if (!signer){
      throw new Error('Signer is required.')
    }
    const disclosure_digest = await sd_hash.compute(presented_token)
    const kbt = await signer.sign({
      protectedHeader: sortProtectedHeader({ alg, kid, typ: KB_JWT_TYP_HEADER }),
      claimset: {
        iss,
        iat,
        nonce,
        aud,
        sd_hash: disclosure_digest
      }
    })
    presented_token += kbt
  }
  return presented_token as PresentedCompactSdJwt;
};