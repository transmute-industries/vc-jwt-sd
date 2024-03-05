import fs from "fs";
import SD from "../../src";

import testcase from '../../src/interoperability/testcase'

import { Scalar, YAMLSeq, Pair } from "yaml";

const testcases = fs.readdirSync("testcases/", { withFileTypes: true });

const digester = testcase.digester('sha-256')

describe("array_recursive_sd", () => {
  const test = { name: "array_recursive_sd" };
  it(test.name, async () => {
    const spec = testcase.getSpec(`testcases/${test.name}/specification.yml`)
    const salter = testcase.getSalter(`testcases/${test.name}/sd_jwt_issuance.txt`)
    const issuedPayload = await SD.YAML.issuancePayload(spec.get("user_claims"), {
      disclosures: {},
      salter: (item: any)=>{
        const testValue = JSON.stringify(item)
        if (testValue === `{"foo":"bar","_sd":["skwztm65ui1P-czrc_O0mqK3ictorCEojr98U6LkDQg"]}`){
          return 'eluV5Og3gSNII8EYnsxA_A'
        }
        const salt = salter(item)
        return salt
      },
      digester,
    });
    const expectedPayload = testcase.getExpectedPayload(
      `testcases/${test.name}/sd_jwt_issuance_payload.json`
    );
    expect(issuedPayload).toEqual(expectedPayload);
  });
});

describe("recursions", () => {
  const test = { name: "recursions" };
  it(test.name, async () => {
    const spec = testcase.getSpec(`testcases/${test.name}/specification.yml`)
    // console.log(testcase.decodeExpectedIssuance(`testcases/${test.name}/sd_jwt_issuance.txt`))
    const issuedPayload = await SD.YAML.issuancePayload(spec.get("user_claims"), {
      disclosures: {},
      salter: (item: any)=>{
        if (item instanceof Scalar){
          const testValue = item.value
          if (testValue === `one`){
            return '2GLC42sKQveCfGfryNRN9w'
          }
          if (testValue === `two`){
            return 'eluV5Og3gSNII8EYnsxA_A'
          }
          if (testValue === `blue`){
            return 'Qg_O64zqAxe412a108iroA'
          }
          if (testValue === `yellow`){
            return 'AJx-095VPrpTtN4QMOqROA'
          }
          if (testValue === `orange`){
            return 'G02NSrQfjFXQ7Io09syajA'
          }
          if (testValue === `purple`){
            return 'lklxF5jMYlGTPUovMNIvCA'
          }
          if (testValue === `black`){
            return '5bPs1IquZNa0hkaFzzzZNw'
          }
          if (testValue === `white`){
            return '5a2W0_NrlEZzfqmk_7Pq-w'
          }
          
        } else if (item instanceof YAMLSeq) {
          const testValue = JSON.stringify(item)
          if (testValue === `[{"...":"E6QoeALfeAMfI45ypn6BwchHsVqnCZWJrkNqOSaNKb0"},{"...":"JZwiDrJWimepx2E-F0MScZRSwz8bQOhs9lZ-eecEgNo"}]`){
            return 'Pc33JM2LchcU_lHggv_ufQ'
          }
          if (testValue === `[{"...":"pJjOvSDrHEZ5GLjXRNMNAro697QTej1Hh0qwbHk6xRk"},{"...":"_cxFIY228AMufvDaALJ4EX4KdElJ-ItArvUCViznqE8"}]`){
            return 'nPuoQnkRFq3BIeAm7AnXFA'
          }
          if (testValue === `[{"...":"n1e4noMbVyIHOFO6pT06qlRvpE09z3AqIQmCW1ALJJI"},{"...":"MfM0cAGzU8tHZF4eL8PiyghuQfmd90LE7mA1S9Uu-94"}]`){
            return 'y1sVU5wdfJahVdgwPgS7RQ'
          }
          
        } else if (item instanceof Pair) {
          const testValue = JSON.stringify(item)
          if (testValue === `{"red":1}`) {
            return `6Ij7tM-a5iVPGboS5tmvVA`
          }
          if (testValue === `{"green":2}`) {
            return `eI8ZWm9QnKPpNPeNenHdhQ`
          }
          if (testValue === `{"name":"python"}`) {
            return `HbQ4X8srVW3QDxnIJdqyOA`
          }
          if (testValue === `{"age":10}`) {
            return `C9GSoujviJquEgYfojCb1A`
          }
          if (testValue === `{"snake":{"_sd":["PUJh3u2HG4JPgc-lodnGUrzcvttmJmcW7pGr7BF9sng","VEqGWBBf3K6J31cuxx7cBIDFE2bGPGgp7zO1BMvG7Aw"]}}`) {
            return `kx5kF17V-x0JmwUx9vgvtw`
          }
          if (testValue === `{"name":"eagle"}`) {
            return `H3o1uswP760Fi2yeGdVCEQ`
          }
          if (testValue === `{"age":20}`) {
            return `OBKlTVlvLg-AdwqYGbP8ZA`
          }
          if (testValue === `{"bird":{"_sd":["vn044ncLmh5HgEFFHZ0pbHS5-7a2jI0UXHqBBM1jzn8","SXfnMyJLOxcqUw4n-t-UUxQFoaHWP3NCiSsXY37Nq9E"]}}`) {
            return `M0Jb57t41ubrkSuyrDT3xA`
          }
        } 
        throw new Error('unhandled hard coded salt')
      },
      digester,
    });
    const expectedPayload = testcase.getExpectedPayload(
      `testcases/${test.name}/sd_jwt_issuance_payload.json`
    );
    expect(issuedPayload).toEqual(expectedPayload);
  });
});


// these cases should be handled seperatly
const skipNames = ['json_serialization', 'key_binding', 'recursions', 'array_recursive_sd', 'settings.yml', '.DS_Store']

describe("yaml specification", () => {
  for (const test of testcases) {
    if (skipNames.includes(test.name)) {
      continue;
    }
    it(test.name, async () => {
      const spec = testcase.getSpec(`testcases/${test.name}/specification.yml`)
    const issuedPayload = await SD.YAML.issuancePayload(spec.get("user_claims"), {
      disclosures: {},
      salter: testcase.getSalter(`testcases/${test.name}/sd_jwt_issuance.txt`),
      digester,
    });
    const expectedPayload = testcase.getExpectedPayload(
      `testcases/${test.name}/sd_jwt_issuance_payload.json`
    );
    expect(issuedPayload).toEqual(expectedPayload);
    });
  }
});
