
import {  decodeJwt, decodeProtectedHeader } from 'jose';

import sd from "../../src";

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
      typ: `application/vc-ld+sd-jwt`,
      privateKeyJwk: issuerRole.privateKeyJwk 
    })
    .issue({
      jwk: holderRole.publicKeyJwk,
      claimset
    })
  const vp = await sd.holder({ 
      privateKeyJwk: holderRole.privateKeyJwk,
      iss: holderId,
      kid: holderKeyId
    })
    .issue({
      token: vc,
      disclosure,
      audience,
      nonce
    })
    const dereference = async (didUrl: string)=>{
    // for testing, not a real dereferencer
    if (didUrl.startsWith('https://university.example/issuers/565049')){
      return { 
        id: issuerKeyId,
        type: 'JsonWebKey',
        controller: issuerId,
        publicKeyJwk: issuerRole.publicKeyJwk
      }
    }
    if (didUrl.startsWith('did:example:ebfeb1f712ebc6f1c276e12ec21')){
      return { 
        id: holderKeyId,
        type: 'JsonWebKey',
        controller: holderId,
        publicKeyJwk: holderRole.publicKeyJwk
      }
    }
    throw new Error('Unsupported didUrl: ' + didUrl)
  }
  const tokenVerifier = {
    verify: async (token: string) => {
      const jwt = token.split('~')[0]
      const decodedHeader = decodeProtectedHeader(jwt)
      if (decodedHeader.typ === 'application/vc-ld+sd-jwt'){
        const decodedPayload = decodeJwt(jwt)
        const iss = (decodedHeader.iss || decodedPayload.iss) as string
        const kid = decodedHeader.kid as string
        const absoluteDidUrl = kid && kid.startsWith(iss)? kid : `${iss}#${kid}`
        const { publicKeyJwk } = await dereference(absoluteDidUrl)
        const verifier = await sd.jws.verifier(publicKeyJwk)
        return verifier.verify(jwt)
      } 
      if (decodedHeader.typ === 'kb+jwt'){
        const decodedPayload = decodeJwt(jwt)
        const iss = (decodedHeader.iss || decodedPayload.iss) as string
        const kid = decodedHeader.kid as string
        const absoluteDidUrl = kid && kid.startsWith(iss)? kid : `${iss}#${kid}`
        const { publicKeyJwk } = await dereference(absoluteDidUrl)
        const verifier = await sd.jws.verifier(publicKeyJwk)
        return verifier.verify(jwt)
      } 
      throw new Error('Unsupported token typ')
    }
  }
  const verification = await sd.verifier({
      verifier: tokenVerifier
    })
    .verify({
      token: vp,
      audience,
      nonce
    })
    if (!verification.claimset.cnf){
      throw new Error('confirmation expected')
    }
    expect(verification.claimset.cnf.jwk).toBeDefined()  
});