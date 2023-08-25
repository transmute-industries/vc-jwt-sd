import crypto from 'crypto'

import SD from "../../src";

const salter = async () => {
  return crypto.randomBytes(16);
}

const digester = {
  name: 'sha-256' as 'sha-256',
  digest: async (cbor: Buffer) => {
    return crypto.createHash("sha256").update(cbor).digest();
  }
}

it('E2E SD-CWT', async () => {
  const issuer = await SD.v2.Issuer.build({
    alg: -35,
    digester,
    salter
  })

  const claims = `
# https://www.iana.org/assignments/cwt/cwt.xhtml
1: 'did:web:issuer.example'
!sd string: a string
number: 10
10: 100
arr1:
  - "bar"
  - !sd "baz"
arr2:
  - 10
  - 20
  `
  const vc = await issuer.issue({
    claims,
  })

  const verified = await issuer.verify({
    vc
  })

  console.log(verified)
});