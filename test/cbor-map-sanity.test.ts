import * as cbor from 'cbor-web'

it('cbor maps', async () => {
  const input = new Map();
  input.set('a', 'b')
  input.set(1, 2)
  input.set(true, false)
  const encoded = await cbor.encodeAsync(input)
  const decoded = await cbor.decodeFirst(encoded)
  // console.log(decoded)
});