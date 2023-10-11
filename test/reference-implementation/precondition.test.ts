
import SD from "../../src";

import crypto from 'crypto'

import { base64url, exportJWK, generateKeyPair } from 'jose';

import testcase from '../../src/interoperability/testcase'


const salter = async () => {
  return base64url.encode(crypto.randomBytes(16));
}

it('throws when _sd is present in user claims', async () => {
  expect.assertions(1)
  const alg = 'ES384'
  const issuerKeyPair  = await generateKeyPair(alg)
  const digester = testcase.digester('sha-256')
  const issuerPrivateKey = await exportJWK(issuerKeyPair.privateKey)
  const issuerSigner = await SD.JWS.signer(issuerPrivateKey)
  const issuer = new SD.Issuer({
    alg,
    digester,
    signer: issuerSigner,
    salter
  })

  const schema = SD.YAML.parseCustomTags(`
user_claims:
  _sd:
    - "causes error"
  `)
  try{
    await issuer.issue({
      claims: schema.get('user_claims'),
    })
  } catch(e){
    expect((e as any).message).toBe('claims may not contain _sd')
  }
});