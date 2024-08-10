

import YAML from "../YAML-SD"
import digester from "./digester"
import salter from "./salter"
import JWS from "./JWS"

import moment from "moment"

import { RequestIssuer, IssuedCompactSdJwt } from "../types"

import {
  DIGEST_ALG_KEY,
  COMBINED_serialization_FORMAT_SEPARATOR,
} from "./constants";

import { issuancePayload } from "../YAML-SD/issuancePayload";
import { sortProtectedHeader } from './sortProtectedHeader'

const issuer = (options: RequestIssuer) => {
  if (options.privateKeyJwk){
    options.alg = options.privateKeyJwk.alg
  }
  if (!options.digester){
    options.digester = digester()
  }
  if (!options.salter){
    options.salter = salter()
  }
  if (!options.alg && options.signer){
    throw new Error('alg must be passed as an option or restricted via privateKeyJwk')
  }
  return {
    issue: async ({ claimset, jwk, kid, iat, exp }: { claimset: string, jwk?:any, kid?: any, iat?: string, exp?: string }): Promise<IssuedCompactSdJwt> => {
      if (!options.signer){
        if (!options.privateKeyJwk){
          throw new Error("signer or privateKeyJwk required for issuance")
        }
        options.signer = await JWS.signer(options.privateKeyJwk)
      }
      if (!options.digester){
        throw new Error('digester is required.')
      }
      const config = {
        disclosures: {},
        salter: options.salter,
        digester: options.digester,
      }
      const issuedPayload = await issuancePayload(YAML.load(claimset), config);
      const protectedHeader = { alg: options.alg, kid: options.kid, typ: options.typ, cty: options.cty }
      const claims = {
        iss: options.iss,
        iat: iat || moment().unix(),
        exp: exp || moment().add(2, 'weeks').unix(),
        cnf: jwk || kid ? {
          jwk,
          kid,
        }: undefined,
        [DIGEST_ALG_KEY]: config.digester.name,
        ...issuedPayload
      }
      const issuedJwt = await options.signer.sign({
        protectedHeader: sortProtectedHeader(protectedHeader),
        claimset: claims,
      });
      const issuedSdJwt = issuedJwt + COMBINED_serialization_FORMAT_SEPARATOR + Object.keys(config.disclosures)
      .join(COMBINED_serialization_FORMAT_SEPARATOR)
      return issuedSdJwt as IssuedCompactSdJwt;
    }
  }
}

export default issuer