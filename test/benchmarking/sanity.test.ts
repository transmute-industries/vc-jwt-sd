import { getExample, averageExecutionTime } from '../../src/benchmarking/help.sd'

it('should generate variable length examples, with disclosure annotations for data integrity and sd-jwt', async () => {
  const example1 = getExample(5)
  // console.log(JSON.stringify(example1.example, null, 2))
  // console.log(JSON.stringify(example1.mandatoryPointers, null, 2))
  // console.log(JSON.stringify(example1.selectivePointers, null, 2))
  // console.log(example1.disclosable)
  expect(example1.example).toBeDefined()
  expect(example1.mandatoryPointers).toBeDefined()
  expect(example1.selectivePointers).toBeDefined()
  expect(example1.disclosable).toBeDefined()
});

it('should measure and average async function execution', async () => {
  const randomAsyncFunction = async () => {
    return new Promise((resolve)=>{
      // let timeMs = Math.random() * 100;
      let timeMs = 10; // with overhead, actual runtime will always exceed this.
      setTimeout(resolve, timeMs)
    })
  }
  const averageExecTimeMs = await averageExecutionTime(randomAsyncFunction)
  expect(averageExecTimeMs).toBeGreaterThanOrEqual(10)
});