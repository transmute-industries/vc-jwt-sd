import { IssuedCompactSdJwt } from "../types";

import {
  DIGEST_ALG_KEY,
  COMBINED_serialization_FORMAT_SEPARATOR,
} from "./constants";

import { issuancePayload } from "../YAML-SD/issuancePayload";
import { sortProtectedHeader } from './sortProtectedHeader'

export const _issue = async ({ claims, iat, exp, salter, digester, alg, kid, typ, cty, iss, cnf, signer  }: any) => {
  const config = {
    disclosures: {},
    salter: salter,
    digester: digester,
  }
  const issuedPayload = await issuancePayload(claims, config);
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