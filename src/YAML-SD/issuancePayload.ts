
import { base64url } from 'jose'
import {
  Pair,
  Scalar,
  YAMLMap,
  YAMLSeq,
} from "yaml";

import { discloseTag } from "./constants";

import { redactSource } from './disclose'

import { serializeDisclosure } from './serializeDisclosure';

import { walkMap } from "./walkMap";

const updateTarget = (source: any, sourceItem: any, index: any, targetItem: any)=> {
  if (sourceItem instanceof Pair){
    let foundExistingDisclosure = source.items.find((item: any)=>{
      return item.key.value === '_sd'
    })
    if (!foundExistingDisclosure){
       const disclosureKeyScalar = new Scalar('_sd')
       const disclosureKeySeq = new YAMLSeq()
       foundExistingDisclosure = new Pair(disclosureKeyScalar, disclosureKeySeq)
       source.items.push(foundExistingDisclosure)
    } 
    foundExistingDisclosure.value.items.push(targetItem)
  } else {
    source.items[index] = targetItem
  }
}


const getDisclosureItem = async (salt: string, source: any, config: any)=>{
  const json = serializeDisclosure(salt, source)
  const encoded =  base64url.encode(json)
  // spy here...
  const disclosureHash = await config.digester.digest(encoded)
  config.disclosures[encoded] = disclosureHash
  const disclosureHashScalar = new Scalar(disclosureHash)
  if (source instanceof Pair){
    return disclosureHashScalar
  } else {
    const disclosePair = new Pair('...', disclosureHashScalar)
    const discloseElement = new YAMLMap()
    discloseElement.add(disclosePair)
    return discloseElement
  }
}

const addDisclosure = async (source: any, index: string, sourceItem:any, config: any) => {
  const salt = config.salter(sourceItem)

  if (!salt){
    console.warn(JSON.stringify(sourceItem, null, 2))
    throw new Error('Unhandled salt disclosure...')
  }
  const item = await getDisclosureItem(salt, sourceItem, config)
  updateTarget(source, sourceItem, index, item)
}

const issuanceWalkMap = async(source: YAMLMap, config: any) => {
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
      // indexList.push(parseInt(index, 10));
    }
  }
  redactSource(source, indexList);
};


const disclosureSorter = (pair: any)=>{
  if (pair.key && pair.key.value === '_sd'){
    pair.value.items.sort((a:any, b:any)=>{
      if (a.value >= b.value){
        return 1
      } else {
        return -1
      }
    })
  }
}

const preconditionChecker = (pair: any)=>{
  if (pair.key && pair.key.value === '_sd'){
   throw new Error('claims may not contain _sd')
  }
}

export const issuancePayload = async (doc: any, config: any)=>{
  walkMap(doc, preconditionChecker)
  await issuanceWalkMap(doc, config);
  walkMap(doc, disclosureSorter)
  return JSON.parse(JSON.stringify(doc)) 
}