import crypto from 'crypto'
import moment from 'moment';
import { base64url, exportJWK, generateKeyPair } from 'jose';

import testcase from '../src/interoperability/testcase'

import SD from "../src";

it('JSON Pointer', async () => {
  const alg = 'ES384'
  const iss = 'did:web:issuer.example'
  const nonce = '9876543210'
  const aud = 'did:web:verifier.example'
  const issuerKeyPair  = await generateKeyPair(alg)
  const holderKeyPair  = await generateKeyPair(alg)
  const digester = testcase.digester('sha-256')
  const issuerPrivateKey = await exportJWK(issuerKeyPair.privateKey)
  const issuerSigner = await SD.JWS.signer(issuerPrivateKey)
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
  const vc = await issuer.issue({
    claims: schema.get('user_claims'),
    iat: moment().unix(),
    exp: moment().add(1, 'years').unix(),
    holder: holderPublicKey
  })

  // pointers
  const result = await SD.YAML.tokenToSchema(vc, { digester })
  // console.log(result)

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

  // pointers
  // TODO: fix pointer to disclosed cases..
  // const result2 = SD.YAML.tokenToSchema(vp, { digester: SD.digester })
  // console.log(result2)
  
});