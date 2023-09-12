
import cose from '@transmute/cose'
import * as cbor from 'cbor-web'
import { exportJWK, generateKeyPair } from 'jose';
import {issuancePayload} from './yaml-to-cbor';
import YAML from '../YAML-SD';
import filterCredential from './filter-credential';
import postVerifyProcessing from './post-verify-processing';

import { RequestVerify } from './types'

export type CWTHolder = {
  alg: number
  
  signer: any
  verifier: any
  salter: any
  digester: any

  publicKeyJwk: any

  disclosures?: Map<string, Buffer>
}

export type RequestPresentation = {
  vc: Uint8Array; // cose sign 1 / cwt.
  disclose: string // really yaml disclose structure
}

export type HolderBuilder = {
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

export class Holder {
  static build = async (arg: HolderBuilder) => {
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
    return new Holder({
      ...arg,
      publicKeyJwk,
      signer,
      verifier,
    })
  }
  constructor(public config: CWTHolder){
    // console.log({ config })
  }
  public present = async (req: RequestPresentation)=>{
    const decodedToken = await cbor.decodeFirst(req.vc)
    const parsed = YAML.load(req.disclose)
    const revealMap = await issuancePayload(parsed, this.config)
    const decodedPayload = await cbor.decodeFirst(decodedToken.value[2], {})

    const disclosures = decodedToken.value[1].get(333) as Buffer[]

    const decodedPayloadMap = decodedPayload instanceof Map ?  decodedPayload : new Map(Object.entries(decodedPayload));

    const disclosureMap = new Map()
    // consider refactoring this mess
    const disclosureArray = await Promise.all(disclosures.map(async (d) => {
      const item = {
        encoded: d,
        decoded: await cbor.decodeFirst(d),
        digest: (await this.config.digester.digest(d)).toString('hex'),
      }
      disclosureMap.set(item.digest, item.decoded)
      return item
    }))
    await filterCredential(decodedPayloadMap, revealMap, disclosureMap )
    const redactedDisclosures = []
    for (const [key, value] of disclosureMap) {
      redactedDisclosures.push(await cbor.encodeAsync(value))
    }

    const unprotectedHeader = new Map();
    unprotectedHeader.set(333, redactedDisclosures)
    const presentation = cose.unprotectedHeader.set(req.vc, unprotectedHeader)
    return presentation
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
    
    return postVerifyProcessing(claims, disclosureMap)
  }
}