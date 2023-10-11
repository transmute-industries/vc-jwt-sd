import fs from 'fs'

import { getExample } from '../../src/benchmarking/help.sd'

import { createSdIssuanceHelper, createSdPresentationHelper, createSdVerificationHelper } from '../../src/benchmarking/help.sd-jwt'

let ex: any;

beforeAll(async () => {
  ex = getExample(5)
  fs.writeFileSync('docs/datasets/example.json', JSON.stringify(ex.example, null, 2))
  fs.writeFileSync('docs/datasets/disclosable.yaml', ex.disclosable)
  fs.writeFileSync('docs/datasets/disclosure.yaml', ex.disclosure)
})

it('issuance', async () => {
  const measurable = await createSdIssuanceHelper(ex)
  await measurable()
});

it('presentation', async () => {
  const measurable = await createSdPresentationHelper(ex)
  await measurable()
});

it('verification', async () => {
  const measurable = await createSdVerificationHelper(ex)
  const verified = await measurable()
  fs.writeFileSync('docs/datasets/verified.sd.json', JSON.stringify(verified, null, 2))
});