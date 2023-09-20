import { getExample } from '../../src/benchmarking/help.sd'

import { createSdIssuanceHelper } from '../../src/benchmarking/help.sd-jwt'

 let measurableAsyncFunction: any;

beforeAll(async () => {
  const ex = getExample(2)
  measurableAsyncFunction = await createSdIssuanceHelper(ex)
})

it('Time sd-jwt integrity', async () => {
  await measurableAsyncFunction()
});