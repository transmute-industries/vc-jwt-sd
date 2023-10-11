
import { base64url } from 'jose';

import random from './random';

export default () => {
  const salter = async () => {
    const array = await random(16)
    const encoded = base64url.encode(array);
    return encoded
  }
  return salter
};

