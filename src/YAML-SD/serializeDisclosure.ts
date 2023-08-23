import { base64url } from "jose";
import {
  YAMLMap,
  YAMLSeq,
  Pair,
  parse,
  Scalar
} from "yaml";

const serializeList = (list: YAMLSeq)=>{
  return JSON.stringify(JSON.parse(JSON.stringify(list))).replace(/"\:/g, '": ').replace(/,/g, ', ')
}

const serializeMap = (map: YAMLMap)=>{
  const first = JSON.stringify(map)
  const  {_sd, ...rest} = JSON.parse(first)
  if (Array.isArray(_sd)){
    _sd.sort()
  }
  return JSON.stringify({_sd, ...rest}).replace(/"\:/g, '": ').replace(/,/g, ', ')
}

const serializeScalar = (value: Scalar) => {
  return `${JSON.stringify(value.value).replace(/,/g, ', ')}`
}

export const serializeDisclosure = (salt: string, item: any) => {
  if (item instanceof Pair){
    if (item.value instanceof YAMLSeq){
      return `["${salt}", "${item.key.value}", ${serializeList(item.value)}]`
    } else if (item.value instanceof YAMLMap){
      return `["${salt}", "${item.key.value}", ${serializeMap(item.value)}]`
    } else {
      return `["${salt}", ${JSON.stringify(item.key.value).replace(/,/g, ', ') }, ${serializeScalar(item.value)}]`
    }
  } else if (item instanceof YAMLSeq){
    return `["${salt}", ${serializeList(item)}]`
  } else if (item instanceof YAMLMap){
    return `["${salt}", ${serializeMap(item)}]`
  } else {
    return `["${salt}", ${JSON.stringify(JSON.parse(JSON.stringify(parse(item.value)))).replace(/\:/g, ': ') }]`
  }
}
