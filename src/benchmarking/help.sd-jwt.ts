import crypto from 'crypto'
import { base64url, decodeJwt } from 'jose'

import SD from "..";


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

export const createSdIssuanceHelper = async (ex: {example: any, mandatoryPointers: string[], selectivePointers: string[], disclosable: string}) => {
  const alg = 'ES256' // can't use ES384 DataIntegrityProof bug.
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

export const createSdPresentationHelper = async (ex: {example: any, mandatoryPointers: string[], selectivePointers: string[], disclosable: string, disclosure: string}) => {
  const alg = 'ES256' // can't use ES384 because of DataIntegrityProof bug.
  const issuerKeyPair = await SD.JWK.generate(alg)
  const issuerSigner = await SD.JWS.signer(issuerKeyPair.secretKeyJwk)
  const issuer = new SD.Issuer({
    alg,
    digester,
    signer: issuerSigner,
    salter
  })
  const sdClaims = SD.YAML.load(ex.disclosable)
  const vc = await issuer.issue({
    claims: sdClaims
  })
  const holder = new SD.Holder({
    alg,
    digester,
  })
  // const issuerVerifier = {
  //   verify: async (token :string) => {
  //     const parsed = SD.Parse.compact(token)
  //     const verifier = await SD.JWS.verifier(issuerKeyPair.publicKeyJwk)
  //     return verifier.verify(parsed.jwt)
  //   }
  // }
  // const verifier = new SD.Verifier({
  //   alg,
  //   digester,
  //   verifier: issuerVerifier
  // })
  const sdDisclosure = SD.YAML.load(ex.disclosure)
  return async ()=> {
    const vp = await holder.present({
      credential: vc,
      disclosure: sdDisclosure,
    })
    // const verified = await verifier.verify({
    //   presentation: vp,
    // })
    // console.log(JSON.stringify(verified, null, 2))
  }
}
