

import YAML from "../YAML-SD"
import digester from "./digester"
import salter from "./salter"
import JWS from "../lib/JWS"

import { RequestIssuer,  Salter,  Digester, Signer, IssuedCompactSdJwt } from "../types"

import { _issue } from "../lib/_issue"

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
    issue: async ({ claimset, jwk, kid }: { claimset: string, jwk?:any, kid?: any }): Promise<IssuedCompactSdJwt> => {
      if (!options.signer){
        if (!options.privateKeyJwk){
          throw new Error("signer or privateKeyJwk required for issuance")
        }
        options.signer = await JWS.signer(options.privateKeyJwk)
      }
      return _issue({
        alg: options.alg as string,
        iss: options.iss,
        kid: options.kid,
        typ: options.typ,
        cty: options.cty,
        salter: options.salter as Salter,
        digester: options.digester as Digester,
        cnf: jwk || kid ? {
          jwk,
          kid,
        }: undefined,
        signer: options.signer,
        claims: YAML.load(claimset)
      })
    }
  }
}

export default issuer