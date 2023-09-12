import fs from 'fs'
import SD from "../../src";

import testcase from '../testcase'

const salter = testcase.salter

it('W3C VC JOSE COSE Test', async () => {
  const alg = 'ES384'
  const nonce = '9876543210'
  const aud = 'did:web:verifier.example'
  const issuerKeyPair  = await SD.JWK.generate(alg)
  const holderKeyPair  = await SD.JWK.generate(alg)
  const digester = testcase.digester('sha-256')
  const issuer = new SD.Issuer({
    alg,
    digester,
    signer: await SD.JWS.signer(issuerKeyPair.secretKeyJwk),
    salter
  })
  const holder = new SD.Holder({
    alg,
    digester,
    signer: await SD.JWS.signer(holderKeyPair.secretKeyJwk)
  })
  const verifier = new SD.Verifier({
    alg,
    digester,
    verifier: {
      verify: async (token: string) => {
        const parsed = SD.Parse.compact(token)
        const verifier = await SD.JWS.verifier(issuerKeyPair.publicKeyJwk)
        return verifier.verify(parsed.jwt)
      }
    }
  })
  const claimsYaml = fs.readFileSync(`test/vc-jose-cose-test/payload.yaml`).toString()
  const claims = SD.YAML.load(claimsYaml)
  const vc = await issuer.issue({
    holder: holderKeyPair.publicKeyJwk,
    claims
  })
  
  const claimsDisclosureYaml = fs.readFileSync(`test/vc-jose-cose-test/payload-disclosure.yaml`).toString()
  const disclosure = SD.YAML.load(claimsDisclosureYaml)
  const vp = await holder.present({
    credential: vc,
    nonce,
    aud,
    disclosure,
  })

  const verified = await verifier.verify({
    presentation: vp,
    nonce,
    aud
  })
  expect(verified.claimset.proof.created).toBe('2023-06-18T21:19:10Z')
});