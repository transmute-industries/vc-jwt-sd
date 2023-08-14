import crypto from "crypto";
import { base64url } from "jose";

const digester = (name: 'sha-256')=>{
  return {
    name,
    digest: (json: string) => {
      return base64url.encode(crypto.createHash("sha256").update(json).digest())
    }
  } 
}

export default digester
