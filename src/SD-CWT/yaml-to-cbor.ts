import cose from '@transmute/cose'
import * as cbor from 'cbor-web'
import {
  Pair,
  Scalar,
  YAMLMap,
  YAMLSeq,
} from "yaml";
// import { base64url } from 'jose';

import YAML from '../YAML-SD';
import { walkMap } from "../YAML-SD/walkMap";

export const discloseTag = `!sd`;
// const sdJwtMapProp = `_sd`
export const sdCwtMapProp = 111

// const sdJwtArrayProp = `...`
export const sdCwtArrayProp = 222


const discloseReplace = (source: Scalar | YAMLSeq | YAMLMap | Pair) => {
  if (
    source instanceof Scalar ||
    source instanceof YAMLSeq ||
    source instanceof YAMLMap
  ) {
    const mutate = source as any;
    delete mutate.toJSON;
    delete mutate.sd;
    delete mutate.tag;
  } else if (source instanceof Pair) {
    const mutate = source as any;
    delete mutate.key.tag;
    delete mutate.value.toJSON;
    delete mutate.value.sd;
    delete mutate.value.tag;
  } else {
    console.log(source)
    throw new Error("discloseReplace, Unhandled disclosure case");
  }
};

const redactSource = (source: any, indexList: number[]) => {
  source.items = source.items.filter((_: any, i: number) => {
    discloseReplace(source.items[i]);
    return !indexList.includes(i);
  });
};


const serializeDisclosure = (salt: Uint8Array, item: any): Uint8Array => {
  const list:any = [salt]
  if (item instanceof Pair){
    list.push(item.key.value);
    list.push(JSON.parse(JSON.stringify(item.value)));
  } else if (item instanceof YAMLSeq){
    list.push(JSON.parse(JSON.stringify(item)));
  } else if (item instanceof YAMLMap){
    list.push(JSON.parse(JSON.stringify(item)));
  } else {
    list.push(JSON.parse(JSON.stringify(item)));
  }
  return Buffer.from(cose.cbor.encode(list))
}

const updateTarget = (source: any, sourceItem: any, index: any, targetItem: any) => {
  if (sourceItem instanceof Pair) {
    let foundExistingDisclosure = source.items.find((item: any) => {
      return item.key.value === sdCwtMapProp
    })
    if (!foundExistingDisclosure) {
      const disclosureKeyScalar = new Scalar(sdCwtMapProp)
      const disclosureKeySeq = new YAMLSeq()
      foundExistingDisclosure = new Pair(disclosureKeyScalar, disclosureKeySeq)
      source.items.push(foundExistingDisclosure)
    }
    foundExistingDisclosure.value.items.push(targetItem)
  } else {
    source.items[index] = targetItem
  }
}


const getDisclosureItem = async (salt: Uint8Array, source: any, config: any) => {
  const cbor = serializeDisclosure(salt, source)
  const disclosureHash = await config.digester.digest(cbor)
  config.disclosures.set(disclosureHash.toString('hex'), cbor)
  const disclosureHashScalar = new Scalar(disclosureHash)
  if (source instanceof Pair) {
    return disclosureHashScalar
  } else {
    const disclosePair = new Pair(new Scalar(sdCwtArrayProp), disclosureHashScalar)
    const discloseElement = new YAMLMap()
    discloseElement.add(disclosePair)
    return discloseElement
  }
}

const addDisclosure = async (source: any, index: string, sourceItem: any, config: any) => {
  const salt = await config.salter(sourceItem)
  if (!salt) {
    console.warn(JSON.stringify(sourceItem, null, 2))
    throw new Error('Unhandled salt disclosure...')
  }
  const item = await getDisclosureItem(salt, sourceItem, config)
  updateTarget(source, sourceItem, index, item)
}

const issuanceWalkMap = async (source: YAMLMap, config: any) => {
  if (source === null){
    return
  }
  const indexList = [] as number[];
  for (const index in source.items) {
    const sourcePair = source.items[index] as any;
    if (sourcePair.value instanceof YAMLSeq) {
      await issuanceWalkList(sourcePair.value as YAMLSeq, config);
    }
    if (sourcePair.value instanceof YAMLMap) {
      await issuanceWalkMap(sourcePair.value, config);
    }
    if (sourcePair.key.tag === discloseTag) {
      await addDisclosure(source, index, sourcePair, config)
      indexList.push(parseInt(index, 10));
    }
  }
  redactSource(source, indexList);
};

const issuanceWalkList = async (source: YAMLSeq, config: any) => {
  const indexList = [] as number[];
  for (const index in source.items) {
    const sourceElement = source.items[index] as any;
    if (sourceElement instanceof YAMLSeq) {
      await issuanceWalkList(sourceElement, config);
    }
    if (sourceElement instanceof YAMLMap) {
      await issuanceWalkMap(sourceElement, config);
    }
    if (sourceElement.tag === discloseTag) {
      await addDisclosure(source, index, sourceElement, config)
    }
  }
  redactSource(source, indexList);
};


const disclosureSorter = (pair: any) => {
  if (pair.key && pair.key.value === sdCwtMapProp) {
    pair.value.items.sort((a: any, b: any) => {
      if (a.value >= b.value) {
        return 1
      } else {
        return -1
      }
    })
  }
}

const preconditionChecker = (pair: any) => {
  if (pair.key && pair.key.value === sdCwtMapProp) {
    throw new Error('claims may not contain _sd')
  }
}



const cborWalkMap = async (source: YAMLMap, target: Map<any, any>, config: any) => {
  if (source === null){
    return
  }
  for (const index in source.items) {
    const sourcePair = source.items[index] as any;
    if (sourcePair.value instanceof YAMLSeq) {
      const targetValue = new Array()
      target.set(sourcePair.key.value, targetValue)
      await cborWalkList(sourcePair.value as YAMLSeq, targetValue, config);
    }
    if (sourcePair.value instanceof YAMLMap) {
      const targetValue = new Map();
      target.set(sourcePair.key.value, targetValue)
      await cborWalkMap(sourcePair.value, targetValue, config,);
    }
    if (sourcePair.value instanceof Scalar) {
      const mapKey = typeof sourcePair.key === 'string' ? sourcePair.key : sourcePair.key.value
      target.set(mapKey, sourcePair.value.value)
    }

  }

};

const cborWalkList = async (source: YAMLSeq, target: Array<any>, config: any) => {
  for (const index in source.items) {
    const sourceElement = source.items[index] as any;
    if (sourceElement instanceof YAMLSeq) {
      const targetValue = new Array()
      target.push(targetValue)
      await cborWalkList(sourceElement, targetValue, config);
    } else if (sourceElement instanceof YAMLMap) {
      const targetValue = new Map();
      target.push(targetValue)
      await cborWalkMap(sourceElement, targetValue, config);
    } else if (sourceElement.value instanceof Scalar || sourceElement.value instanceof Buffer || typeof sourceElement.value === 'string' || typeof sourceElement.value === 'number') {
      target.push(sourceElement.value)
    } else if (sourceElement instanceof Scalar) {
      target.push(sourceElement.value)
    } else {
      throw new Error('Unhandled case... ' + JSON.stringify(sourceElement, null, 2))
    }
  }
};

const yamlMapToJsMap = async (doc: YAMLMap, config: any): Promise<Map<any,any>> => {
  const finalMap = new Map();
  await cborWalkMap(doc, finalMap, config)
  return finalMap
}

export const issuancePayload = async (doc: any, config: any) => {
  walkMap(doc, preconditionChecker)
  await issuanceWalkMap(doc, config);
  walkMap(doc, disclosureSorter)
  return yamlMapToJsMap(doc, config)
}

const yamlToCbor = async (yamlClaims: string, config: any) => {
  const parsed = YAML.load(yamlClaims)
  config.disclosures = new Map();
  const payloadMap = await issuancePayload(parsed, config)
  return cbor.encodeAsync(payloadMap)
  
}

export default yamlToCbor;
