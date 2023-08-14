import { RequestIssuance, CompactSign, Digest, IssuerCtx, Salter } from "./types";

import {
  DIGEST_ALG_KEY,
  COMBINED_serialization_FORMAT_SEPARATOR,
} from "./constants";

import JWK from "./JWK";

import { issuancePayload } from "./YAML-SD/issuancePayload";

// SDJWTIssuer
export default class Issuer {
  public iss?: string;
  public alg: string;
  public digester: Digest;
  public signer: CompactSign;
  public salter: Salter;
  constructor(ctx: IssuerCtx) {
    this.iss = ctx.iss;
    this.alg = ctx.alg;
    this.digester = ctx.digester;
    this.signer = ctx.signer;
    this.salter = ctx.salter
  }
  issue = async ({ claims, iat, exp, holder }: RequestIssuance) => {
    const config = {
      disclosures: {},
      salter: this.salter,
      digester: this.digester.digest,
    }
    const issuedPayload = issuancePayload(claims, config);
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
    const jws = await this.signer.sign({
      protectedHeader: {
        alg: this.alg,
      },
      claimset,
    });
    return jws + COMBINED_serialization_FORMAT_SEPARATOR + Object.keys(config.disclosures)
    .join(COMBINED_serialization_FORMAT_SEPARATOR);
  };
}
