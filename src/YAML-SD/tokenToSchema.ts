
import {
  Pair,
  Scalar,
  YAMLMap,
  YAMLSeq,
  stringify,
} from "yaml";

import pointer from 'json-pointer'

import { yamlOptions } from "./yamlOptions";

import Parse from "../Parse"

const discloseMap = `🔴`
const disloseSeq = `🟡`
const discloseTag = `!sd`
const discloseObj = `_sd`
const discloseArray = `...`

const walkList = (list:any[], seq: YAMLSeq| any, config: any)=>{
  for (const index in list){
    const element = list[index]
    if (element[discloseArray]){
      const hash = element[discloseArray];
      config.disclosureMap[hash].shift() // discard salt
      const disclosure = config.disclosureMap[hash]
      const [ discloseValue ] = disclosure
      if (disclosure.length === 1){
        element[disloseSeq] = discloseValue
        if (Array.isArray(discloseValue)){
          const seqValue = new YAMLSeq()
          seqValue.tag = discloseTag
          seq.add(seqValue)
          walkList(discloseValue, seqValue, config)
        } else if (typeof discloseValue === 'object' && discloseValue !== null){
          const mapValue = new YAMLMap()
          mapValue.tag = discloseTag
          seq.add(mapValue)
          walkMap(discloseValue, mapValue, config)
        } else {
          const scalarValue = new Scalar(discloseValue)
          scalarValue.tag = discloseTag
          seq.add(scalarValue)
        }
      }
      delete element[discloseArray]
      // list.slice(parseInt(index, 10), 1)
    } else if (Array.isArray(element)){
      const seqValue = new YAMLSeq()
      seq.add(seqValue)
      walkList(element, seqValue, config)
    } else if (typeof element === 'object' && element !== null){
      const mapValue = new YAMLMap()
      seq.add(mapValue)
      walkMap(element, mapValue, config)
    } else {
      //
      const scalarValue = new Scalar(element)
      seq.add(scalarValue)
    }
  }
}

const walkMap = (obj:any, map: YAMLMap, config: any)=>{
  for (const [key,value] of Object.entries(obj)){
    if (key === discloseObj){
      for (const hash of value as string[]){
        config.disclosureMap[hash].shift() // discard salt
        const disclosure = config.disclosureMap[hash]
        const [discloseKey, discloseValue] = disclosure
        if (disclosure.length === 2){
          obj[`${discloseMap}` + discloseKey] = discloseValue
          const scalarKey = new Scalar(discloseKey)
          scalarKey.tag = discloseTag
          if (Array.isArray(discloseValue)){
            const seqValue = new YAMLSeq()
            const pair = new Pair(scalarKey, seqValue)
            map.add(pair)
            walkList(discloseValue, seqValue, config)
          } else if (typeof discloseValue === 'object' && discloseValue !== null){
            const mapValue = new YAMLMap()
            const pair = new Pair(scalarKey, mapValue)
            map.add(pair)
            walkMap(discloseValue, mapValue, config)
          } else {
            const scalarValue = new Scalar(discloseValue)
            const pair = new Pair(scalarKey, scalarValue)
            map.add(pair)
          }
        }
      }
      delete obj[discloseObj]
    } else if (Array.isArray(value)){
      const scalarKey = new Scalar(key)
      const seqValue = new YAMLSeq()
      const pair = new Pair(scalarKey, seqValue)
      map.add(pair)
      walkList(value, seqValue, config)
    } else if (typeof value === 'object' && value !== null){
      const scalarKey = new Scalar(key)
      const mapValue = new YAMLMap()
      const pair = new Pair(scalarKey, mapValue)
      map.add(pair)
      walkMap(value, mapValue, config)
    } else {
      //
      const scalarKey = new Scalar(key)
      const scalarValue = new Scalar(value)
      const pair = new Pair(scalarKey, scalarValue)
      map.add(pair)
    }
  }
}

export const tokenToSchema = (token: string, config: any) => {
  const parsed = Parse.expload(token, config)
  const schema = new YAMLMap()
  config.disclosureMap = parsed.disclosureMap
  delete parsed.issued._sd_alg
  walkMap(parsed.issued, schema, config)
  return {
    yaml: stringify(schema, yamlOptions),
    json: JSON.stringify(schema, null, 2),
    pretty: parsed.issued,
    disclosureMap: config.disclosureMap,
    pointers: pointer.dict(parsed.issued)
  }
}