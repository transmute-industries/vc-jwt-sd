import crypto from 'crypto'
import * as cbor from 'cbor-web'
// https://www.ietf.org/archive/id/draft-ietf-cose-key-thumbprint-01.html#section-6
// {
//   1:2,
//  -1:1,
//  -2:h'65eda5a12577c2bae829437fe338701a
//       10aaa375e1bb5b5de108de439c08551d',
//  -3:h'1e52ed75701163f7f9e40ddf9f341b3d
//       c9ba860af7e0ca7ca7e9eecd0084d19c'
// }
it('https://www.ietf.org/archive/id/draft-ietf-cose-key-thumbprint', async () => {
  const coseKey = new Map();
  coseKey.set(1, 2)
  coseKey.set(-1, 1)
  coseKey.set(-2, Buffer.from('65eda5a12577c2bae829437fe338701a10aaa375e1bb5b5de108de439c08551d', 'hex'))
  coseKey.set(-3, Buffer.from('1e52ed75701163f7f9e40ddf9f341b3dc9ba860af7e0ca7ca7e9eecd0084d19c', 'hex'))
  const encoded = cbor.encode(coseKey)
  const digest = crypto.createHash("sha256").update(encoded).digest()
  expect(digest.toString('hex')).toBe('496bd8afadf307e5b08c64b0421bf9dc01528a344a43bda88fadd1669da253ec')
});