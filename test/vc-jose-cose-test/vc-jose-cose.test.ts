import fs from 'fs'
import SD from "../../src";

import testcase from '../../src/interoperability/testcase'


const salter = testcase.salter

it('W3C VC JOSE COSE Test', async () => {
  const alg = 'ES384'
  const nonce = '9876543210'
  const audience = 'did:web:verifier.example'
  const issuerKeyPair  = await SD.JWK.generate(alg)
  const holderKeyPair  = await SD.JWK.generate(alg)
  const digester = testcase.digester('sha-256')
  const issuer = SD.issuer({
    alg,
    digester,
    signer: await SD.JWS.signer(issuerKeyPair.privateKeyJwk),
    salter
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
  const vc = await issuer.issue({
    jwk: holderKeyPair.publicKeyJwk,
    claimset:claimsYaml
  })
  
  const claimsDisclosureYaml = fs.readFileSync(`test/vc-jose-cose-test/payload-disclosure.yaml`).toString()

  const vp = await SD.holder({
    alg,
    digester,
    signer: await SD.JWS.signer(holderKeyPair.privateKeyJwk)
  }).issue({
    token: vc,
    nonce,
    audience: audience,
    disclosure: claimsDisclosureYaml,
  })

  const verified = await verifier.verify({
    presentation: vp,
    nonce,
    aud: audience
  })
  expect(verified.claimset.proof.created).toBe('2023-06-18T21:19:10Z')
});