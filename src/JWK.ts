import { PrivateKeyJwk, PublicKeyJwk } from "./types";

import { generateKeyPair, exportJWK } from 'jose'

const format = (jwk: PublicKeyJwk | PrivateKeyJwk) => {
  const { kid, x5u, x5c, x5t, kty, crv, alg, key_ops, x, y, d, ...rest } = jwk;
  return JSON.parse(
    JSON.stringify({
      kid,
      x5u,
      x5c,
      x5t,
      kty,
      crv,
      alg,
      key_ops,
      x,
      y,
      d,
      ...rest,
    })
  );
};

export const getPublicKey = (jwk: any): PublicKeyJwk => {
  const { d, p, q, dp, dq, qi, oth, k, key_ops, ...publicKeyJwk } = jwk;
  return format(publicKeyJwk);
};

const getExtractableKeyPair = async (alg: string) =>{
  const keypair  = await generateKeyPair(alg, {extractable: true})
  const publicKeyJwk = await exportJWK(keypair.publicKey)
  publicKeyJwk.alg = alg
  const secretKeyJwk = await exportJWK(keypair.privateKey)
  secretKeyJwk.alg = alg
  return { 
    publicKeyJwk: format(publicKeyJwk),
    secretKeyJwk: format(secretKeyJwk)
  }
}


const JWK = { format, getPublicKey, generate: getExtractableKeyPair };

export default JWK;
