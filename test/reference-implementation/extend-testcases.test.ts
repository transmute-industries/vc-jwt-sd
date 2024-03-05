import fs from 'fs'
import testcase from '../../src/interoperability/testcase'

const testcases = fs.readdirSync('testcases/', { withFileTypes: true });


const skipTestNames= ['json_serialization', 'settings.yml', '.DS_Store']

describe("extend testcases", () => {
  for (const test of testcases){
    if (skipTestNames.includes(test.name)){
      continue
    }
    it(test.name, async () => {
      const decodedIssuance = testcase.decodeExpectedIssuance(`testcases/${test.name}/sd_jwt_issuance.txt`)
      fs.writeFileSync(`testcases/${test.name}/sd_jwt_issuance_payload.json`, JSON.stringify(decodedIssuance.decoded.payload, null, 2))
    });
  }
});



