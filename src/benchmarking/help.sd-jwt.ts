import crypto from 'crypto'
import {base64url} from 'jose'

import SD from "..";

export const createSdIssuanceHelper = async (ex: {example: any, pointers: string[], disclosable: string}) => {
  const alg = 'ES256' // can't use ES384 DataIntegrityProof bug.
  const salter = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const encoded = base64url.encode(array);
    return encoded
  }
  const digester =  {
    name: 'sha-256' as 'sha-256',
    digest: async (json: string) => {
      const content = new TextEncoder().encode(json);
      const digest = await crypto.createHash('sha256').update(content).digest();
      return base64url.encode(new Uint8Array(digest));
    }
  }
  const issuerKeyPair = await SD.JWK.generate(alg)
  const issuerSigner = await SD.JWS.signer(issuerKeyPair.secretKeyJwk)
  const issuer = new SD.Issuer({
    alg,
    digester,
    signer: issuerSigner,
    salter
  })
  const sdClaims = SD.YAML.load(ex.disclosable)
  return async ()=> {
    await issuer.issue({
      claims: sdClaims
    })
  }
}