
import { base64url } from 'jose';

import runtime from './runtime';

const getBrowserDigester = (name = 'sha-256') => {
  if (name !== 'sha-256'){
    throw new Error('hash function not supported')
  }
  return {
    name,
    digest: async (json: string) => {
      const content = new TextEncoder().encode(json);
      const digest = await window.crypto.subtle.digest(name.toUpperCase(), content);
      return base64url.encode(new Uint8Array(digest));
    }
  };
 };
 
const getNodeDigester = () => {
  const crypto = require('crypto');
  const digester =  {
    name: 'sha-256' as 'sha-256',
    digest: async (json: string) => {
      const content = new TextEncoder().encode(json);
      const digest = await crypto.createHash('sha256').update(content).digest();
      return base64url.encode(new Uint8Array(digest));
    }
  }
  return digester;
}

const digester = () => {
  if (runtime.isBrowser()) {
    return getBrowserDigester()
  } else {
    return getNodeDigester()
  }
}

export default digester;




