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

```ts

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