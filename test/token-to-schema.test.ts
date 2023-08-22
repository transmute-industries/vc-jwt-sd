import crypto from 'crypto'
import { base64url, exportJWK, generateKeyPair } from 'jose';

import testcase from './testcase'
import SD from "../src";

const digester = testcase.digester('sha-256')

describe('token to schema', () => {
  it.todo('rescursions and other advanced testcases for sanity')
  it('array_with_recursive_sd', async () => {
    const alg = 'ES384'
    const issuerKeyPair  = await generateKeyPair(alg)
   
    const issuerPrivateKey = await exportJWK(issuerKeyPair.privateKey)
    const issuerSigner = await SD.JWS.signer(issuerPrivateKey)
    const salter = () => {
      return base64url.encode(crypto.randomBytes(16));
    }
    const issuer = new SD.Issuer({
      alg,
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
    })
    const result = await SD.YAML.tokenToSchema(vc, { digester })
    // console.log(result.yaml)
    // console.log(result.json)
    // console.log(JSON.stringify(result.pretty, null ,2))
    // console.log(JSON.stringify(result.pointers, null ,2))
  });
})
