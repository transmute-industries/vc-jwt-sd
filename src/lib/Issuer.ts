import { RequestIssuance, Signer, Digester, IssuerCtx, Salter, IssuedCompactSdJwt } from "../types";

import {
  DIGEST_ALG_KEY,
  COMBINED_serialization_FORMAT_SEPARATOR,
} from "./constants";

import JWK from "./JWK";

import { issuancePayload } from "../YAML-SD/issuancePayload";
import { sortProtectedHeader } from './sortProtectedHeader'

// SDJWTIssuer
export default class Issuer {
  public iss?: string;
  public alg: string;
  public kid?: string;
  public typ?: string;
  public cty?: string;
  public digester: Digester;
  public signer: Signer;
  public salter: Salter;
  constructor(ctx: IssuerCtx) {
    this.iss = ctx.iss;
    this.alg = ctx.alg;
    this.kid = ctx.kid;
    this.typ = ctx.typ;
    this.cty = ctx.cty;
    this.digester = ctx.digester;
    this.signer = ctx.signer;
    this.salter = ctx.salter
  }
  issue = async ({ claims, iat, exp, holder }: RequestIssuance) => {
    const { signer, digester, salter, iss, alg, kid, typ, cty } = this;
    const config = {
      disclosures: {},
      salter: salter,
      digester: digester,
    }
    const issuedPayload = await issuancePayload(claims, config);
    let cnf = undefined;
    if (holder) {
      if (typeof holder === 'object'){
        cnf = {
          jwk: JWK.getPublicKey(holder),
        };
      } else if (typeof holder === 'string'){
        cnf = {
          kid: holder,
        };
      } else {
        throw new Error('Unsupported holder type.')
      }
    }
    const protectedHeader = { alg, kid, typ, cty }
    const claimset = {
      iss,
      iat,
      exp,
      cnf,
      [DIGEST_ALG_KEY]: digester.name,
      ...issuedPayload
    }
    const issuedJwt = await signer.sign({
      protectedHeader: sortProtectedHeader(protectedHeader),
      claimset,
    });
    const issuedSdJwt = issuedJwt + COMBINED_serialization_FORMAT_SEPARATOR + Object.keys(config.disclosures)
    .join(COMBINED_serialization_FORMAT_SEPARATOR)
    return issuedSdJwt as IssuedCompactSdJwt;
  };
}
