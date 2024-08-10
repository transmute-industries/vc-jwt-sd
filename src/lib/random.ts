// @ts-ignore
const nodeCrypto = import('crypto').catch(() => {}) as any

export default async (byteLength = 16) => {
  try {
    return crypto.getRandomValues(new Uint8Array(byteLength))
  } catch {
    return (await nodeCrypto).randomFillSync(new Uint8Array(byteLength))
  }
}