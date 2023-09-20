import fs from 'fs'

import { getExample, averageExecutionTime } from '../../src/benchmarking/help.sd'
import { createDiIssuanceHelper } from '../../src/benchmarking/help.data-integrity'
import { createSdIssuanceHelper } from '../../src/benchmarking/help.sd-jwt'

const exLengths = [] as number[]
const diRuntimes = [] as number[]
const sdRuntimes = [] as number[]

for (let length = 2; length < 5; length++){
  describe(`Test array length ${length}`, () => {
    let issueWithSdJwt: any;
    let issueWithDataIntegrity: any;
    beforeAll(async () => {
      const ex = getExample(length)
      issueWithDataIntegrity = await createDiIssuanceHelper(ex)
      issueWithSdJwt = await createSdIssuanceHelper(ex)
      exLengths.push(length)
    })
    it('Time di issuance', async () => {
      const averageExecTimeMs = await averageExecutionTime(issueWithDataIntegrity)
      diRuntimes.push(averageExecTimeMs)
    });
    it('Time sd-jwt issuance', async () => {
      const averageExecTimeMs = await averageExecutionTime(issueWithSdJwt)
      sdRuntimes.push(averageExecTimeMs)
    });
  })
}

afterAll(()=>{
  // write report to disk
  const data = [exLengths, diRuntimes, sdRuntimes]
  fs.writeFileSync('test/benchmarking/data.json', JSON.stringify(data))
  console.log(data)
})