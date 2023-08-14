import * as jose from "jose";
import { PrivateKeyJwk, PublicKeyJwk, SignParams } from "./types";

import JWK from "./JWK";

const signer = async (privateKeyJwk: PrivateKeyJwk) => {
  const privateKey = await jose.importJWK(privateKeyJwk);
  return {
    sign: async ({ protectedHeader, claimset }: SignParams) => {
      return new jose.CompactSign(
        new TextEncoder().encode(JSON.stringify(claimset))
      )
        .setProtectedHeader(protectedHeader)
        .sign(privateKey);
    },
  };
};

const verifier = async (publicKeyJwk: PublicKeyJwk) => {
  const publicKey = await jose.importJWK( JWK.getPublicKey(publicKeyJwk) );
  return {
    verify: async (jws: string) => {
      const result = await jose.compactVerify(jws, publicKey);
      return {
        protectedHeader: result.protectedHeader,
        claimset: JSON.parse(new TextDecoder().decode(result.payload)),
      };
    },
  };
};

const JWS = { signer, verifier };

export default JWS;
