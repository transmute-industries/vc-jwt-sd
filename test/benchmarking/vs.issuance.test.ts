import fs from 'fs'

import { getExample, averageExecutionTime } from '../../src/benchmarking/help.sd'
import { createDiIssuanceHelper } from '../../src/benchmarking/help.data-integrity'
import { createSdIssuanceHelper } from '../../src/benchmarking/help.sd-jwt'

const exLengths = [] as number[]
const diRuntimes = [] as number[]
const sdRuntimes = [] as number[]

describe.skip('issuance', () => {
  for (let length = 2; length < 100; length++) {
    describe(`Test array length ${length}`, () => {
      let issueWithSdJwt: any;
      let issueWithDataIntegrity: any;
      let diAverageExecTimeMs: number;
      let sdAverageExecTimeMs: number;
      beforeAll(async () => {
        const ex = getExample(length)
        issueWithDataIntegrity = await createDiIssuanceHelper(ex)
        issueWithSdJwt = await createSdIssuanceHelper(ex)
      })
      it('Time di issuance', async () => {
        diAverageExecTimeMs = await averageExecutionTime(issueWithDataIntegrity)
      });
      it('Time sd-jwt issuance', async () => {
        sdAverageExecTimeMs = await averageExecutionTime(issueWithSdJwt)
      })
      afterAll(() => {
        exLengths.push(length)
        diRuntimes.push(diAverageExecTimeMs)
        sdRuntimes.push(sdAverageExecTimeMs)
      });
    })
  }

  afterAll(() => {
    const data = [exLengths, diRuntimes, sdRuntimes]
    fs.writeFileSync('docs/datasets/issuance.json', JSON.stringify(data))
  })
})
