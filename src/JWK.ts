import { PrivateKeyJwk, PublicKeyJwk } from "./types";

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

const JWK = { format, getPublicKey };

export default JWK;
