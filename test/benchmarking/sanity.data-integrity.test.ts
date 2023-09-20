import { getExample } from '../../src/benchmarking/help.sd'

import { createDiIssuanceHelper } from '../../src/benchmarking/help.data-integrity'

 let measurableAsyncFunction: any;

beforeAll(async () => {
  const ex = getExample(2)
  measurableAsyncFunction = await createDiIssuanceHelper(ex)
})

it('Time data integrity', async () => {
  await measurableAsyncFunction()
});