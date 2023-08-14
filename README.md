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

TBD

```ts
import crypto from 'crypto'
import moment from 'moment';
import { base64url, exportJWK, generateKeyPair } from 'jose';
import SD from "@transmute/vc-jwt-sd";
const alg = 'ES384'
const iss = 'did:web:issuer.example'
const nonce = '9876543210'
const aud = 'did:web:verifier.example'
const schema = SD.YAML.parseCustomTags(`
user_claims:
array_with_recursive_sd:
  - boring
  - foo: "bar"
    !sd baz:
      qux: "quux"
  - [!sd "foo", !sd "bar"]

test2: [!sd "foo", !sd "bar"]

holder_disclosed_claims:
array_with_recursive_sd:
  - None
  - baz: True
  - [False, True]

test2: [True, True]

expect_verified_user_claims:
array_with_recursive_sd:
  - boring
  - foo: bar
    baz:
      qux: quux
  - ["bar"]

test2: ["foo", "bar"]
`)
const issuerKeyPair  = await generateKeyPair(alg)
const holderKeyPair  = await generateKeyPair(alg)
const digester = SD.digester('sha-256')
const issuerPublicKey = await exportJWK(issuerKeyPair.publicKey)
const issuerPrivateKey = await exportJWK(issuerKeyPair.privateKey)
const issuerSigner = await SD.JWS.signer(issuerPrivateKey)
const issuerVerifier = {
  verify: async (token :string) => {
    const parsed = SD.Parse.compact(token)
    const verifier = await SD.JWS.verifier(issuerPublicKey)
    return verifier.verify(parsed.jwt)
  }
}
const holderPublicKey = await exportJWK(holderKeyPair.publicKey)
const holderPrivateKey = await exportJWK(holderKeyPair.privateKey)
const holderSigner = await SD.JWS.signer(holderPrivateKey)
const salter = () => {
  return base64url.encode(crypto.randomBytes(16));
}
const issuer = new SD.Issuer({
  alg,
  iss,
  digester,
  signer: issuerSigner,
  salter
})
const vc = await issuer.issue({
  claims: schema.get('user_claims'),
  iat: moment().unix(),
  exp: moment().add(1, 'years').unix(),
  holder: holderPublicKey
})
const holder = new SD.Holder({
  alg,
  digester,
  signer: holderSigner
})
const vp = await holder.present({
  credential: vc,
  disclosure: schema.get('holder_disclosed_claims'),
  nonce,
  aud
})
const verifier = new SD.Verifier({
  alg,
  digester,
  verifier: issuerVerifier
})
const verified = await verifier.verify({
  presentation: vp,
  nonce,
  aud
})
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