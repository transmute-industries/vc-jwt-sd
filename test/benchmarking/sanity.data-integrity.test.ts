import fs from 'fs'

import { getExample } from '../../src/benchmarking/help.sd'

import { createDiIssuanceHelper, createDiPresentationHelper, createDiVerificationHelper } from '../../src/benchmarking/help.data-integrity'

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

it('verification', async () => {
  const measurableAsyncFunction = await createDiVerificationHelper(ex)
  const verified = await measurableAsyncFunction()
  fs.writeFileSync('docs/datasets/verified.di.json', JSON.stringify(verified, null, 2))
});