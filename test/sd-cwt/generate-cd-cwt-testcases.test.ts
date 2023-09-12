import fs from 'fs'
import yaml from 'yaml'
import crypto from 'crypto'

import SD from "../../src";
import { base64url } from 'jose';
import * as cbor from 'cbor-web'
const salter = async () => {
  return crypto.randomBytes(16);
}

const digester = {
  name: 'sha-256' as 'sha-256',
  digest: async (cbor: Buffer) => {
    return crypto.createHash("sha256").update(cbor).digest();
  }
}

const testcases = fs.readdirSync('test/sd-cwt/testcases', { withFileTypes: true });

const focusTestNames:string[] = [
  // 'data-types-arrays'
]

let issuer: any;
let holder: any;

describe("testcases", () => {
  beforeAll(async()=>{
    issuer = await SD.v2.Issuer.build({
      alg: -35,
      digester,
      salter
    })
    holder = await SD.v2.Holder.build({
      alg: -35,
      digester,
      salter
    })
  })
  it('issuer and holder must be defined', async () => {
    expect(issuer).toBeDefined();
    expect(holder).toBeDefined();
  });
  for (const test of testcases){
    if (focusTestNames.length && !focusTestNames.includes(test.name)){
      continue
    }
    it(test.name, async () => {
      const payload = fs.readFileSync(`test/sd-cwt/testcases/${test.name}/payload.yaml`).toString()
      const disclosure = fs.readFileSync(`test/sd-cwt/testcases/${test.name}/payload-disclosure.yaml`).toString()
      const vc = await issuer.issue({
        claims: payload,
      })
      const vp = await holder.present({
        vc,
        disclose: disclosure
      })
      const verified = await issuer.verify({
        vc: vp
      })
      const spec = new yaml.YAMLMap()
      const decodedVc = await cbor.decodeFirst(vc)
      const protectedHeader = await cbor.decodeFirst(decodedVc.value[0])
      spec.add(new yaml.Pair('protected_header', protectedHeader))
      spec.add(new yaml.Pair('payload', SD.YAML.load(payload)))
      spec.add(new yaml.Pair('disclosure', SD.YAML.load(disclosure)))
      spec.add(new yaml.Pair('issuer_key', issuer.config.publicKeyJwk))
      spec.add(new yaml.Pair('holder_key', holder.config.publicKeyJwk))
      spec.add(new yaml.Pair('issuance', base64url.encode(vc)))
      spec.add(new yaml.Pair('presentation', base64url.encode(vp)))
      spec.add(new yaml.Pair('verified', verified))
      // console.log(verified)
      fs.writeFileSync(`test/sd-cwt/testcases/${test.name}/spec.yaml`, SD.YAML.dumps(spec))
    })
  }
});