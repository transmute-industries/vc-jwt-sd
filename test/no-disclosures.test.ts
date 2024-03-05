import * as jose from 'jose'
import sd from '../src'
const alg = 'ES256';
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
    - value: test value 1
      lang: en
    - value: test value 2
      lang: en
    - value: test value 3
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

it('simple setup', async () => {
  const { publicKeyJwk, secretKeyJwk } = await sd.key.generate(alg);
  const vc = await sd.issuer({ secretKeyJwk })
    .issue({
      holder: publicKeyJwk,
      claimset
    })
  const decodedHeader = jose.decodeProtectedHeader(vc)
  expect(decodedHeader).toEqual({ alg: 'ES256' })
  const decodedPayload = jose.decodeJwt(vc)
  // even with no disclosures, "_sd_alg" is set
  expect(decodedPayload._sd_alg).toBe('sha-256')
});
