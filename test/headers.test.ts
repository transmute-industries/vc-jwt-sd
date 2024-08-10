
import moment from 'moment';

import SD from "../src";

import testcase from '../src/interoperability/testcase'

const salter = testcase.salter

it('W3C Example', async () => {
  const alg = 'ES384'
  const iss = 'did:web:issuer.example'
  const nonce = '9876543210'
  const audience = 'did:web:verifier.example'
  const issuerKeyPair = await SD.JWK.generate(alg)
  const holderKeyPair = await SD.JWK.generate(alg)
  const digester = testcase.digester('sha-256')
  const issuer = SD.issuer({
    alg,
    kid: `${iss}#key-42`,
    typ: `application/vc+sd-jwt`,
    cty: `application/vc+ld+json`,
    iss,
    digester,
    signer: await SD.JWS.signer(issuerKeyPair.privateKeyJwk),
    salter
  })
  const vc = await issuer.issue({
    jwk: holderKeyPair.publicKeyJwk,
    claimset: `
"@context":
  - https://www.w3.org/ns/credentials/v2
  - https://w3id.org/traceability/v1
id: http://supply-chain.example/credentials/dd0c6f9a-5df6-40a3-bb34-863cd1fda606
type:
  - VerifiableCredential
  - EntryNumberCredential
validFrom: ${moment().toISOString()}
validUntil: ${moment().add(1, 'month').toISOString()}
issuer:
  type:
    - Organization
  id: ${iss}
  name: ACME Customs Broker
  !sd location:
    type:
      - Place
    address:
      type:
        - PostalAddress
      streetAddress: 123 Example Street
      addressLocality: Toronto
      addressRegion: ON
      addressCountry: CA
      postalCode: M3B 1A2
credentialSubject:
  type:
    - EntryNumber
  !sd entryNumber: "12345123456"
`
  })
  const vp = await SD.holder({
    alg,
    digester,
    signer: await SD.JWS.signer(holderKeyPair.privateKeyJwk)
  }).issue({
    token: vc,
    nonce,
    audience,
    disclosure: `
issuer:
  location: False
credentialSubject:
  entryNumber: True
    `,
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
  const verified = await verifier.verify({
    presentation: vp,
    nonce,
    aud: audience
  })
  expect(verified.claimset.issuer.location).toBeUndefined()
  expect(verified.claimset.credentialSubject.entryNumber).toBe('12345123456')
  expect(JSON.stringify(verified.protectedHeader)).toBe(JSON.stringify({ 
    "alg": "ES384", 
    "kid": "did:web:issuer.example#key-42", 
    "typ": "application/vc+sd-jwt", 
    "cty": "application/vc+ld+json" 
  }))

});