
import cose from '@transmute/cose'
import * as cbor from 'cbor-web'
import { exportJWK, generateKeyPair } from 'jose';
import yamlToCbor from './yaml-to-cbor';


export type CWTIssuer = {
  alg: number
  
  signer: any
  verifier: any
  salter: any
  digester: any
}

export type RequestIssuance = {
  claims: string; // really yaml.
}

export type IssuerBuilder = {
  alg: number
  salter: () => Promise<Buffer>
  digester: {
    name: 'sha-256',
    digest: (cbor: Buffer) => Promise<Buffer>
  }
}


const algStringToNumber = {
  'ES384': -35
}

const algNumberToString:any = {
  '-35': 'ES384'
}

export type RequestVerify = {
  vc: Uint8Array
}

export class Issuer {
  static build = async (arg: IssuerBuilder) => {
    const alg = algNumberToString[`${arg.alg}`]
    const keyPair  = await generateKeyPair(alg)
    const secretKeyJwk = await exportJWK(keyPair.privateKey)
    secretKeyJwk.alg = alg
    const publicKeyJwk = await exportJWK(keyPair.publicKey)
    publicKeyJwk.alg = alg
    const signer = await cose.signer({
      privateKeyJwk: secretKeyJwk as any,
    })
    const verifier = await cose.verifier({
      publicKeyJwk: publicKeyJwk as any,
    })
    return new Issuer({
      ...arg,
      signer,
      verifier,
    })
  }
  constructor(public config: CWTIssuer){
    // console.log({ config })
  }
  public issue = async (issuance: RequestIssuance)=>{
    const protectedHeader = { alg: algNumberToString[`${this.config.alg}`] }
    const unprotectedHeader = new Map();
    const payload = await yamlToCbor(issuance.claims, this.config)
    const signArguments = { protectedHeader, unprotectedHeader, payload: Uint8Array.from(payload) }
    const signature = await this.config.signer.sign(signArguments)
    // attach dislocures to unprotected header.
    return signature
  }

  public verify = async ({vc}: RequestVerify)=>{
    const verified = await this.config.verifier.verify(vc)
    return cbor.decodeFirst(verified)
  }
}