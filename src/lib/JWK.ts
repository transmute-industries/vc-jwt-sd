import { PrivateKeyJwk, PublicKeyJwk } from "../types";

import { generateKeyPair, exportJWK, calculateJwkThumbprint } from 'jose'

const format = (jwk: PublicKeyJwk | PrivateKeyJwk): PublicKeyJwk | PrivateKeyJwk => {
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
  return format(publicKeyJwk) ;
};

const getExtractableKeyPair = async (alg: string) =>{
  const keypair  = await generateKeyPair(alg, {extractable: true})
  const publicKeyJwk = await exportJWK(keypair.publicKey)
  publicKeyJwk.alg = alg
  publicKeyJwk.kid = await calculateJwkThumbprint(publicKeyJwk)
  const privateKeyJwk = await exportJWK(keypair.privateKey)
  privateKeyJwk.alg = alg
  privateKeyJwk.kid = await calculateJwkThumbprint(privateKeyJwk)
  return { 
    publicKeyJwk: format(publicKeyJwk as PublicKeyJwk),
    privateKeyJwk: format(privateKeyJwk as PrivateKeyJwk)
  }
}


const JWK = { format, getPublicKey, generate: getExtractableKeyPair };

export default JWK;
