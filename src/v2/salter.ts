
import { base64url } from 'jose';

import runtime from './runtime';

const getBrowserSalter = () => {
  const salter = () => {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const encoded = base64url.encode(array);
    return encoded
  }
  return salter
}

const getNodeSalter = () => {
  const crypto = require('crypto');
  const salter = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const encoded = base64url.encode(array);
    return encoded
  }
  return salter
}

const salter = () => {
  if (runtime.isBrowser()) {
    return getBrowserSalter()
  } else {
    return getNodeSalter()
  }
}

export default salter;

