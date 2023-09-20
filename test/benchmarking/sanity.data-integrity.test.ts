import fs from 'fs'

import { getExample } from '../../src/benchmarking/help.sd'

import { createDiIssuanceHelper, createDiPresentationHelper } from '../../src/benchmarking/help.data-integrity'

let ex: any;

beforeAll(async () => {
  ex = getExample(5)
  fs.writeFileSync('docs/datasets/example.json', JSON.stringify(ex.example, null, 2))
  fs.writeFileSync('docs/datasets/mandatoryPointers.json', JSON.stringify(ex.mandatoryPointers, null, 2))
  fs.writeFileSync('docs/datasets/selectivePointers.json', JSON.stringify(ex.selectivePointers, null, 2))
})

it('issuance', async () => {
  const measurableAsyncFunction = await createDiIssuanceHelper(ex)
  await measurableAsyncFunction()
});

it('presentation', async () => {
  const measurableAsyncFunction = await createDiPresentationHelper(ex)
  await measurableAsyncFunction()
});