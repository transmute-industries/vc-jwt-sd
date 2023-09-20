import fs from 'fs'

import { getExample, averageExecutionTime } from '../../src/benchmarking/help.sd'
import { createDiPresentationHelper } from '../../src/benchmarking/help.data-integrity'
import { createSdPresentationHelper } from '../../src/benchmarking/help.sd-jwt'

const exLengths = [] as number[]
const diRuntimes = [] as number[]
const sdRuntimes = [] as number[]

const maxLength = 1000

describe('presentation', () => {
  for (let length = 2; length < maxLength; length++) {
    const ex = getExample(length)
    describe(`Test array length ${length}`, () => {
      let issueWithSdJwt: any;
      let issueWithDataIntegrity: any;
      let diAverageExecTimeMs: number;
      let sdAverageExecTimeMs: number;
      beforeAll(async () => {
        issueWithDataIntegrity = await createDiPresentationHelper(ex)
        issueWithSdJwt = await createSdPresentationHelper(ex)
      })
      it('time di', async () => {
        diAverageExecTimeMs = await averageExecutionTime(issueWithDataIntegrity)
      });
      it('time sd', async () => {
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
    fs.writeFileSync('docs/datasets/presentation.json', JSON.stringify(data))
  })
})
