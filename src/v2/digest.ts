import { base64url } from 'jose';
// @ts-ignore
const nodeCrypto = import('crypto').catch(() => {}) as any

export default async (json:string) => {
  try {
    const content = new TextEncoder().encode(json);
    const digest = await window.crypto.subtle.digest('SHA-256', content);
    return base64url.encode(new Uint8Array(digest));
  } catch (e) {
    const content = new TextEncoder().encode(json);
    const digest = await (await nodeCrypto).createHash('sha-256').update(content).digest();
    return base64url.encode(new Uint8Array(digest));
  }
}