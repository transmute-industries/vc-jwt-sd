# @transmute/vc-jwt-sd

[![CI](https://github.com/transmute-industries/vc-jwt-sd/actions/workflows/ci.yml/badge.svg)](https://github.com/transmute-industries/vc-jwt-sd/actions/workflows/ci.yml)
![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

<!-- [![NPM](https://nodei.co/npm/@transmute/vc-jwt-sd.png?mini=true)](https://npmjs.org/package/@transmute/vc-jwt-sd) -->

🚧 Experimental implementation of sd-jwt for use with W3C Verifiable Credentials. 🔥

<img src="./transmute-banner.png" />

#### [Questions? Contact Transmute](https://transmute.typeform.com/to/RshfIw?typeform-source=vc-jwt-sd)

## Usage

```bash
npm i @transmute/vc-jwt-sd --save
```

```ts
import sd from '@transmute/vc-jwt-sd'
```

### Issuer Claims

This implementation relies on custom yaml tags to indicate disclosability:

```yaml
# Based on https://w3c.github.io/vc-data-model/#example-a-simple-example-of-a-verifiable-credential
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
    - !sd # indicates a disclosable claim
      value: test value 1
      lang: en
    - value: test value 2
      lang: en
    - !sd # indicates a disclosable claim
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
```

### Credential Issuance

```ts

const alg = 'ES384';
const claimset = `... yaml example above ... `;

const issuerRole = await sd.key.generate(alg);
const issuerId = 'https://university.example/issuers/565049'
const issuerKeyId = `${issuerId}#key-42`

const holderRole = await sd.key.generate(alg); // or get it some other way.
const holderId = 'did:example:ebfeb1f712ebc6f1c276e12ec21'
const holderKeyId = `${holderId}#${holderRole.publicKeyJwk.kid}`

const vc = await sd.issuer({ 
  iss: issuerId, 
  kid: issuerKeyId,
  typ: `application/vc+sd-jwt`,
  privateKeyJwk: issuerRole.privateKeyJwk 
})
.issue({
  holder: holderKeyId,
  claimset
})
```

### Holder Disclosure

This implementation relies on yaml to indicate holder disclosures:

```yaml
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
    - value: test value 1 # The value or True can be provided to signal intentional disclosure.
      lang: en
    - value: test value 2
      lang: en
    - False # This boolean indicates that this claim should not be disclosed in a presentation
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
```

### Presentation with Holder Binding

```ts
const audience = 'aud-9877'
const nonce = 'nonce-5486168'
const disclosure = `... yaml example above ... `;
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
```


### Verification by Key Resolution

Some protocols allow for discovery of public keys from identifiers.

🍃 This interface is safer, 
since it performs verification internally, 
which will fail closed when the incorrect public key is provided.

```ts
const verification = await sd.verifier({
  resolver: {
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
})
.verify({
  token: vp,
  audience,
  nonce
})
```

### Verification by Token

Some protocols require disovery of public keys from protected header and payload claims.

🍂 This interface is less safe, but more flexible.
When misconfigured, this interface can lead to decoded values being treated as if they had been verified.

```ts
// for testing, not a real dereferencer
const dereference = async (url: string) => {
  if (url.startsWith('https://university.example/issuers/565049')){
    return { 
      id: issuerKeyId,
      type: 'JsonWebKey',
      controller: issuerId,
      publicKeyJwk: issuerRole.publicKeyJwk
    }
  }
  if (url.startsWith('did:example:ebfeb1f712ebc6f1c276e12ec21')){
    return { 
      id: holderKeyId,
      type: 'JsonWebKey',
      controller: holderId,
      publicKeyJwk: holderRole.publicKeyJwk
    }
  }
  throw new Error('Unsupported didUrl: ' + didUrl)
}
const verification = await sd.verifier({
  verifier: {
    verify: async (token: string) => {
      const jwt = token.split('~')[0]
      const decodedHeader = decodeProtectedHeader(jwt)
      if (decodedHeader.typ === 'application/vc+sd-jwt'){
        const decodedPayload = decodeJwt(jwt)
        const iss = (decodedHeader.iss || decodedPayload.iss) as string
        const kid = decodedHeader.kid as string
        const absoluteDidUrl = kid && kid.startsWith(iss)? kid : `${iss}#${kid}`
        const { publicKeyJwk } = await dereference(absoluteDidUrl)
        const verifier = await sd.JWS.verifier(publicKeyJwk)
        return verifier.verify(jwt)
      } 
      if (decodedHeader.typ === 'kb+jwt'){
        const decodedPayload = decodeJwt(jwt)
        const iss = (decodedHeader.iss || decodedPayload.iss) as string
        const kid = decodedHeader.kid as string
        const absoluteDidUrl = kid && kid.startsWith(iss)? kid : `${iss}#${kid}`
        const { publicKeyJwk } = await dereference(absoluteDidUrl)
        const verifier = await sd.JWS.verifier(publicKeyJwk)
        return verifier.verify(jwt)
      } 
      throw new Error('Unsupported token typ')
    }
  }
})
.verify({
  token: vp,
  audience,
  nonce
})
```

### Validation

🚧 This library does not perform validation currently.
This is the result of the verification operations above:

```json
{
  "protectedHeader": {
    "alg": "ES384",
    "kid": "https://university.example/issuers/565049#key-42",
    "typ": "application/vc+sd-jwt"
  },
  "claimset": {
    "iss": "https://university.example/issuers/565049",
    "cnf": {
      "jkt": "did:example:ebfeb1f712ebc6f1c276e12ec21#KmC0EKbs0kL2v6kxPP_c4g-HMMy-n8C5NwtN2tH_msc"
    },
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://www.w3.org/ns/credentials/examples/v2"
    ],
    "id": "http://university.example/credentials/3732",
    "type": [
      "VerifiableCredential",
      "ExampleDegreeCredential"
    ],
    "issuer": {
      "id": "https://university.example/issuers/565049",
      "name": [
        {
          "value": "test value 0",
          "lang": "en"
        },
        {
          "value": "test value 1",
          "lang": "en"
        },
        {
          "value": "test value 2",
          "lang": "en"
        },
        {
          "value": "test value 4",
          "lang": "en"
        }
      ]
    },
    "validFrom": "2015-05-10T12:30:00Z",
    "credentialStatus": [
      {
        "id": "https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6#0",
        "type": "StatusList2021Entry",
        "statusPurpose": "revocation",
        "statusListIndex": "0",
        "statusListCredential": "https://vendor.example/status-list/urn:uuid:d31ada5d-1d3d-4f68-8587-8ff9bb3038d6"
      }
    ],
    "credentialSubject": {
      "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
      "degree": {
        "type": "ExampleBachelorDegree",
        "subtype": "Bachelor of Science and Arts"
      }
    },
  }
}
```

## Develop

```bash
npm i
npm t
npm run lint
npm run build
```

## Integration Tests

Synching tests cases from reference implementation

```
git clone git@github.com:danielfett/sd-jwt.git
cd sd-jwt
python3 -m venv venv
source venv/bin/activate
pip install git+https://github.com/danielfett/sd-jwt.git
cd tests/testcases
sd-jwt-generate example
cd ..
cp -r ./testcases ../../testcases
```

Other implementations

- https://github.com/openwallet-foundation-labs/sd-jwt-python
- https://github.com/oauth-wg/oauth-selective-disclosure-jwt
- https://github.com/danielfett/sd-jwt
- https://github.com/christianpaquin/sd-jwt
- https://github.com/chike0905/sd-jwt-ts
- https://github.com/or13/vc-sd-jwt