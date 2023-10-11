import { RequestIssuance, CompactSign, Digest, IssuerCtx, Salter } from "../types";

import {
  DIGEST_ALG_KEY,
  COMBINED_serialization_FORMAT_SEPARATOR,
} from "./constants";

import JWK from "./JWK";

import { issuancePayload } from "../YAML-SD/issuancePayload";

const sortProtectedHeader = (protectedHeader: any)=>{
  const {alg, iss, kid, typ, cty, ...rest} = protectedHeader;
  return JSON.parse(JSON.stringify({
    alg, iss, kid, typ, cty, ...rest
  }))
}

// SDJWTIssuer
export default class Issuer {
  public iss?: string;
  public alg: string;
  public kid?: string;
  public typ?: string;
  public cty?: string;
  public digester: Digest;
  public signer: CompactSign;
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
    const config = {
      disclosures: {},
      salter: this.salter,
      digester: this.digester,
    }
    const issuedPayload = await issuancePayload(claims, config);
    const claimset = issuedPayload as Record<string, unknown>;
    claimset[DIGEST_ALG_KEY] = this.digester.name;
    if (this.iss) {
      claimset.iss = this.iss;
    }
    if (iat){
      claimset.iat = iat
    }
    if (exp){
      claimset.exp = exp
    }
    if (holder) {
      claimset.cnf = {
        jwk: JWK.getPublicKey(holder),
      };
    }
    const protectedHeader = {} as any;

    if (this.alg) {
      protectedHeader.alg = this.alg;
    }
    if (this.kid) {
      protectedHeader.kid = this.kid;
    }
    if (this.typ) {
      protectedHeader.typ = this.typ;
    }
    if (this.cty) {
      protectedHeader.cty = this.cty;
    }
    const jws = await this.signer.sign({
      protectedHeader: sortProtectedHeader(protectedHeader),
      claimset,
    });
    return jws + COMBINED_serialization_FORMAT_SEPARATOR + Object.keys(config.disclosures)
    .join(COMBINED_serialization_FORMAT_SEPARATOR);
  };
}
