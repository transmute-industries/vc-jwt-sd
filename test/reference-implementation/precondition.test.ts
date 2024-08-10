
import sd from "../../src";

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
  const issuerSigner = await sd.jws.signer(issuerPrivateKey)
  const issuer = sd.issuer({
    alg,
    digester,
    signer: issuerSigner,
    salter
  })

  const schema = sd.YAML.parseCustomTags(`
user_claims:
  _sd:
    - "causes error"
  `)
  try{
    await issuer.issue({
      claimset: sd.YAML.dumps(schema.get('user_claims')),
    })
  } catch(e){
    expect((e as any).message).toBe('claims may not contain _sd')
  }
});