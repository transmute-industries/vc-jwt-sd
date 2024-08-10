

import YAML from "../YAML-SD"
import digester from "./digester"
import salter from "./salter"
import JWS from "./JWS"

import moment from 'moment';
import * as jose from "jose";
import { RequestHolder, SdHolderState, PresentedCompactSdJwt } from "../types";
import { COMBINED_serialization_FORMAT_SEPARATOR, KB_JWT_TYP_HEADER } from "./constants";
import _select_disclosures from './_select_disclosures'
import parse from "./Parse";
import { sortProtectedHeader } from './sortProtectedHeader'
import { sd_hash } from "./sd_hash";


const holder = (options: RequestHolder = {}) => {
  if (options.privateKeyJwk) {
    options.alg = options.privateKeyJwk.alg
  }
  if (!options.digester) {
    options.digester = digester()
  }
  if (!options.salter) {
    options.salter = salter()
  }
  if (!options.alg && options.signer) {
    throw new Error('alg must be passed as an option or restricted via privateKeyJwk')
  }
  return {
    issue: async ({ token, disclosure, audience, nonce }: { token: string, disclosure: string, audience?: string | string[], nonce?: string }): Promise<PresentedCompactSdJwt> => {
      if (options.privateKeyJwk) {
        options.signer = await JWS.signer(options.privateKeyJwk)
      }
      const parsed = parse.compact(token)
      // todo: verify
      const sd_jwt_payload = jose.decodeJwt(parsed.jwt);
      const { disclosureMap, hashToEncodedDisclosureMap } = await parse.expload(token, options)
      const state = {
        hs_disclosures: [],
        _hash_to_disclosure: hashToEncodedDisclosureMap,
        _hash_to_decoded_disclosure: disclosureMap
      } as SdHolderState
      const parsedDisclosure = JSON.parse(JSON.stringify(YAML.load(disclosure), null, 2))
      // todo convert to a walk operation
      _select_disclosures(sd_jwt_payload, parsedDisclosure, state)
      // state now contains stuff.
      const disclosures = [...state.hs_disclosures]
      if (sd_jwt_payload.cnf && (!audience || !nonce)) {
        throw new Error('Credential requires confirmation but audience and nonce are missing.')
      }
      let presented_token = parsed.jwt;
      if (disclosures.length) {
        presented_token += COMBINED_serialization_FORMAT_SEPARATOR + disclosures.join(COMBINED_serialization_FORMAT_SEPARATOR)
      }
      presented_token += COMBINED_serialization_FORMAT_SEPARATOR
      if (audience && nonce) {
        if (!sd_jwt_payload.cnf) {
          throw new Error('Credential does not contain confirmation method, therefore audience and nonce are not supported.')
        }
        if (!options.signer) {
          throw new Error('Signer is required.')
        }
        const disclosure_digest = await sd_hash.compute(presented_token)
        const kbt = await options.signer.sign({
          protectedHeader: sortProtectedHeader({ alg: options.alg, kid: options.kid, typ: KB_JWT_TYP_HEADER }),
          claimset: {
            iss: options.iss,
            iat: moment().unix(),
            nonce,
            aud: audience,
            sd_hash: disclosure_digest
          }
        })
        presented_token += kbt
      }
      return presented_token as PresentedCompactSdJwt;
    }
  }
}

export default holder