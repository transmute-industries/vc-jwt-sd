import sd from '../src'
const alg = 'ES384';
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


const helpCheck = async (isVC: boolean, token: string, publicKeyJwk: any, audience?:string, nonce?:string) => {
  // these params indicate a VP
  if (audience && nonce){
    expect(token.split('.').length).toBe(5) // 2 tokens
    expect(token.split('~').length).toBe(3)
    const verification = await sd.v2.verifier({ 
      publicKeyJwk
    })
    .verify({
      token,
      audience,
      nonce
    })
    expect(verification.claimset.issuer.name.length).toBe(4) // partial disclosure
  } else {
    expect(token.split('.').length).toBe(3) // 1 token
    if (isVC){
      expect(token.split('~').length).toBe(3)
       const verification = await sd.v2.verifier({ 
          publicKeyJwk
        })
        .verify({
          token,
          audience,
          nonce
        })
        expect(verification.claimset.issuer.name.length).toBe(5) // full disclosure
    }
  }
}

it('simple setup', async () => {
  const audience = undefined;
  const nonce = undefined;
  const { publicKeyJwk, secretKeyJwk } = await sd.v2.key.generate(alg);
  const vc = await sd.v2.issuer({ secretKeyJwk })
  .issue({
    claimset
  })
  await helpCheck(true, vc, publicKeyJwk, audience, nonce)
  const vp = await sd.v2.holder()
  .issue({
    token: vc,
    disclosure
  })
  await helpCheck(false, vp, publicKeyJwk, audience, nonce)
});

it('verbose setup', async () => {
  let audience = undefined as string | undefined;
  let nonce = undefined as string | undefined;
  const { publicKeyJwk, secretKeyJwk } = await sd.v2.key.generate(alg)
  const signer =  await sd.v2.signer(secretKeyJwk)
  const salter = await sd.v2.salter()
  const digester = await sd.v2.digester()
  const vc = await sd.v2.issuer({ alg, salter, digester, signer })
  .issue({
    holder: publicKeyJwk,
    claimset
  })
  try{
    await helpCheck(true, vc, publicKeyJwk, audience, nonce)
  } catch(e){
    expect((e as any).message).toBe('Verification of this credential requires proof of posession from the holder. Key binding token is expected based on claims, but was not found.')
  }
  audience = `aud-123`;
  nonce = `nonce-456`;
  const vp = await sd.v2.holder({ alg, salter, digester, signer })
  .issue({
    token: vc,
    disclosure,
    audience,
    nonce
  })
  await helpCheck(false, vp, publicKeyJwk, audience, nonce)
});