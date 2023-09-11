import fs from 'fs'
import yaml from 'yaml'
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

const testcases = fs.readdirSync('test/sd-cwt/testcases', { withFileTypes: true });

const focusTestNames:string[] = [
  'data-types-arrays'
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
      spec.add(new yaml.Pair('payload', SD.YAML.load(payload)))
      spec.add(new yaml.Pair('disclosure', SD.YAML.load(disclosure)))
      // TODO: add protected header to spec
      // TODO: add issuer and holder keys to spec
      // TODO: add encoded CWT to spec
      spec.add(new yaml.Pair('verified', verified))
      // console.log(verified)
      fs.writeFileSync(`test/sd-cwt/testcases/${test.name}/spec.yaml`, SD.YAML.dumps(spec))
    })
  }
});