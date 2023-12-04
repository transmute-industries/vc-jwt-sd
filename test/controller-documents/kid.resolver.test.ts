

import sd, { VerifiedTokensWithKeyBinding } from "../../src";

const alg = 'ES384'
const audience = 'aud-9877'
const nonce = 'nonce-5486168'
// based on https://w3c.github.io/vc-data-model/#example-a-simple-example-of-a-verifiable-credential
const claimset = `
"@context":
  - https://www.w3.org/ns/credentials/v2
  - https://www.w3.org/ns/credentials/examples/v2
id: http://university.example/credentials/3732
type:
  - VerifiableCredential
  - ExampleDegreeCredential
issuer:
  id: https://university.example/issuers/565049
  name:
    - value: test value 0
      lang: en
    - !sd
      value: test value 1
      lang: en
    - value: test value 2
      lang: en
    - !sd
      value: test value 3
      lang: en
    - value: test value 4
      lang: en
validFrom: 2015-05-10T12:30:00Z
credentialStatus:
  - id: https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6#0
    type: StatusList2021Entry
    statusPurpose: revocation
    statusListIndex: "0"
    statusListCredential: https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6
credentialSubject:
  id: did:example:ebfeb1f712ebc6f1c276e12ec21
  degree:
    type: ExampleBachelorDegree
    subtype: Bachelor of Science and Arts
`;

const disclosure = `
"@context":
  - https://www.w3.org/ns/credentials/v2
  - https://www.w3.org/ns/credentials/examples/v2
id: http://university.example/credentials/3732
type:
  - VerifiableCredential
  - ExampleDegreeCredential
issuer:
  id: https://university.example/issuers/565049
  name:
    - value: test value 0
      lang: en
    - value: test value 1
      lang: en
    - value: test value 2
      lang: en
    - False
    - value: test value 4
      lang: en
validFrom: 2015-05-10T12:30:00Z
credentialStatus:
  - id: https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6#0
    type: StatusList2021Entry
    statusPurpose: revocation
    statusListIndex: "0"
    statusListCredential: https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6
credentialSubject:
  id: did:example:ebfeb1f712ebc6f1c276e12ec21
  degree:
    type: ExampleBachelorDegree
    subtype: Bachelor of Science and Arts
`;

it('End to End Test', async () => {


  const issuerRole = await sd.key.generate(alg);
  const issuerId = 'https://university.example/issuers/565049'
  const issuerKeyId = `${issuerId}#key-42`

  const holderRole = await sd.key.generate(alg);
  const holderId = 'did:example:ebfeb1f712ebc6f1c276e12ec21'
  const holderKeyId = `${holderId}#${holderRole.publicKeyJwk.kid}`

  const vc = await sd.issuer({ 
      iss: issuerId, 
      kid: issuerKeyId,
      typ: `application/vc+ld+json+sd-jwt`,
      secretKeyJwk: issuerRole.secretKeyJwk 
    })
    .issue({
      holder: holderKeyId,
      claimset
    })
  const vp = await sd.holder({ 
      secretKeyJwk: holderRole.secretKeyJwk,
      iss: holderId,
      kid: holderKeyId
    })
    .issue({
      token: vc,
      disclosure,
      audience,
      nonce
    })
    
  const keyIdResolver = {
    resolve: async (kid: string) => {
      if (kid === issuerKeyId){
        return issuerRole.publicKeyJwk
      } 
      if (kid === holderKeyId){
        return holderRole.publicKeyJwk
      }
      throw new Error('Unsupported kid: ' + kid)
    }
  }

  const verification = await sd.verifier<VerifiedTokensWithKeyBinding>({
      resolver: keyIdResolver
    })
    .verify({
      token: vp,
      audience,
      nonce
    })
    expect(verification.claimset.cnf.jkt).toBeDefined()
});