
import cose from '@transmute/cose'
import * as cbor from 'cbor-web'
import { exportJWK, generateKeyPair } from 'jose';
import yamlToCbor from './yaml-to-cbor';

import postVerifyProcessing from './post-verify-processing';

import { RequestVerify } from './types'

export type CWTIssuer = {
  alg: number
  
  signer: any
  verifier: any
  salter: any
  digester: any

  disclosures?: Map<string, Buffer>
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

    const payload = await yamlToCbor(issuance.claims, this.config)
    const disclosureMap = this.config.disclosures as Map<string, Buffer>
    const unprotectedHeader = new Map();
    const disclosures = Array.from(disclosureMap, ([_, value]) => value);
    unprotectedHeader.set(333, disclosures)

    const signArguments = { protectedHeader, unprotectedHeader, payload: Uint8Array.from(payload) }
    const signature = await this.config.signer.sign(signArguments)
    const signatureWithDisclosuresInUnprotectedHeader = cose.unprotectedHeader.set(signature, unprotectedHeader)
    return signatureWithDisclosuresInUnprotectedHeader
  }

  public verify = async ({vc}: RequestVerify)=>{
    const unprotectedHeader = cose.unprotectedHeader.get(vc)
    const verified = await this.config.verifier.verify(vc)
    const disclosures = unprotectedHeader.get(333) as Buffer[]
    const disclosureMap = new Map()
    await Promise.all(disclosures.map(async (d) => {
      const item = {
        digest: (await this.config.digester.digest(d)).toString('hex'),
        decoded: await cbor.decodeFirst(d)
      }
      disclosureMap.set(item.digest, item.decoded)
    }))
    const claims = await cbor.decodeFirst(verified)
    const claimsMap = claims instanceof Map ?  claims : new Map(Object.entries(claims));
    return postVerifyProcessing(claimsMap, disclosureMap)
  }
}