
import { base64url } from 'jose';


const getSalter = () => {
  const salter = () => {
   const array = new Uint8Array(16);
   window.crypto.getRandomValues(array);
   const encoded = base64url.encode(array);
   return encoded
 }
 return salter
}

const getDigester = (name = 'sha-256') => {
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

const web = { salter: getSalter, digester: getDigester }

export default web