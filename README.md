# @transmute/vc-jwt-sd

[![CI](https://github.com/transmute-industries/vc-jwt-sd/actions/workflows/ci.yml/badge.svg)](https://github.com/transmute-industries/vc-jwt-sd/actions/workflows/ci.yml)
![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)

<!-- [![NPM](https://nodei.co/npm/@transmute/vc-jwt-sd.png?mini=true)](https://npmjs.org/package/@transmute/vc-jwt-sd) -->

🚧 Experimental implementation of sd-jwt for use with W3C Verifiable Credentials. 🔥

🚧 Extra experimental implementation of sd-cwt for SPICE 🔥

<img src="./transmute-banner.png" />

#### [Questions? Contact Transmute](https://transmute.typeform.com/to/RshfIw?typeform-source=vc-jwt-sd)

## Usage

```ts
import crypto from 'crypto'
import moment from 'moment';
import { base64url, exportJWK, generateKeyPair } from 'jose';
import SD from "@transmute/vc-jwt-sd";
const alg = 'ES384'
const iss = 'did:web:issuer.example'
const nonce = '9876543210'
const aud = 'did:web:verifier.example'
const issuerKeyPair  = await generateKeyPair(alg)
const holderKeyPair  = await generateKeyPair(alg)
const digester = SD.digester('sha-256')
const issuer = new SD.Issuer({
  alg,
  iss,
  digester,
  signer: await SD.JWS.signer(await exportJWK(issuerKeyPair.privateKey)),
  salter: () => {
    return base64url.encode(crypto.randomBytes(16));
  }
})
const vc = await issuer.issue({
  iat: moment().unix(),
  exp: moment().add(1, 'month').unix(),
  holder: await exportJWK(holderKeyPair.publicKey),
  claims: SD.YAML.load(`
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
`)
  })
const holder = new SD.Holder({
  alg,
  digester,
  signer: await SD.JWS.signer(await exportJWK(holderKeyPair.privateKey))
})
const vp = await holder.present({
  credential: vc,
  nonce,
  aud,
  disclosure: SD.YAML.load(`
issuer:
  location: False
credentialSubject:
  entryNumber: True
    `),
  })
const verifier = new SD.Verifier({
  alg,
  digester,
  verifier: {
    verify: async (token :string) => {
      const parsed = SD.Parse.compact(token)
      const verifier = await SD.JWS.verifier(await exportJWK(issuerKeyPair.publicKey))
      return verifier.verify(parsed.jwt)
    }
  }
})
const verified = await verifier.verify({
  presentation: vp,
  nonce,
  aud
})
```

Example verification:

```json
{
  "protectedHeader": {
    "alg": "ES384"
  },
  "claimset": {
    "iss": "did:web:issuer.example",
    "iat": 1692022381,
    "exp": 1694700781,
    "cnf": {
      "jwk": {
        "kty": "EC",
        "crv": "P-384",
        "x": "PP4CbKpEGySwO5bPcVFk0bwkSEuRWQdKS3J-m1kpkyLpAxtxqPtzKzcKyr6chh3n",
        "y": "vJ-0xlNOXRQ0iuKA1YpjrxZnCR8bxfsoV-fLascpRWRa3Wu7F67mrYIIjMbrxnD3"
      }
    },
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://w3id.org/traceability/v1"
    ],
    "id": "http://supply-chain.example/credentials/dd0c6f9a-5df6-40a3-bb34-863cd1fda606",
    "type": [
      "VerifiableCredential",
      "EntryNumberCredential"
    ],
    "validFrom": "2023-08-14T14:13:01.795Z",
    "validUntil": "2023-09-14T14:13:01.795Z",
    "issuer": {
      "type": [
        "Organization"
      ],
      "id": "did:web:issuer.example",
      "name": "ACME Customs Broker"
    },
    "credentialSubject": {
      "type": [
        "EntryNumber"
      ],
      "entryNumber": "12345123456"
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