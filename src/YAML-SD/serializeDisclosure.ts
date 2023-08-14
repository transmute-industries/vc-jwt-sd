import { base64url } from "jose";
import {
  YAMLMap,
  YAMLSeq,
  Pair,
  parse
} from "yaml";

const serializeList = (list: YAMLSeq)=>{
  return JSON.stringify(JSON.parse(JSON.stringify(list))).replace(/\:/g, ': ').replace(/,/g, ', ')
}

const serializeMap = (map: YAMLMap)=>{
  const first = JSON.stringify(map)
  const  {_sd, ...rest} = JSON.parse(first)
  if (Array.isArray(_sd)){
    _sd.sort()
  }
  return JSON.stringify({_sd, ...rest}).replace(/\:/g, ': ').replace(/,/g, ', ')
}

export const serializeDisclosure = (salt: string, item: any) => {
  if (item instanceof Pair){
    if (item.value instanceof YAMLSeq){
      return `["${salt}", "${item.key.value}", ${serializeList(item.value)}]`
    } else if (item.value instanceof YAMLMap){
      return `["${salt}", "${item.key.value}", ${serializeMap(item.value)}]`
    } else {
      return `["${salt}", ${JSON.stringify(item.key.value).replace(/,/g, ', ') }, ${JSON.stringify(item.value.value).replace(/,/g, ', ')}]`
    }
  } else if (item instanceof YAMLSeq){
    return `["${salt}", ${serializeList(item)}]`
  } else if (item instanceof YAMLMap){
    return `["${salt}", ${serializeMap(item)}]`
  } else {
    return `["${salt}", ${JSON.stringify(JSON.parse(JSON.stringify(parse(item.value)))).replace(/\:/g, ': ') }]`
  }
}

  // //// WyJlbHVWNU9nM2dTTklJOEVZbnN4QV9BIiwgeyJfc2QiOiBbInNrd3p0bTY1dWkxUC1jenJjX08wbXFLM2ljdG9yQ0VvanI5OFU2TGtEUWciXSwgImZvbyI6ICJiYXIifV0

  // if (disclosureHash === 'jLlkIcGUjlc0jteTpWe61mj_41z1yvN0-1FJsz3heHg'){
  //   const theirs = `WyJlbHVWNU9nM2dTTklJOEVZbnN4QV9BIiwgeyJfc2QiOiBbInNrd3p0bTY1dWkxUC1jenJjX08wbXFLM2ljdG9yQ0VvanI5OFU2TGtEUWciXSwgImZvbyI6ICJiYXIifV0`
    
  //   const theirsDecoded = new TextDecoder().decode(base64url.decode(theirs))
  //   const mineDecoded = new TextDecoder().decode(base64url.decode(encoded))
  //   console.warn(theirsDecoded)
  //   console.warn(mineDecoded)
  //   // disclosureHash = 'JZvSesAZw0Ngs4RUyukL18dsLlqKWnu05HMa1yA-NKI'
  // }

// if (disclosureHash === '0yeikKLfiJsNhNht1N0matFWFh7QUvFk728Xla4F-og'){
//   console.log(salt, source)

//   const encodedFromPython = `WyIyR0xDNDJzS1F2ZUNmR2ZyeU5STjl3IiwgInNkX2FycmF5IiwgWzMyLCAyM11d`
//   // [
//   //   "2GLC42sKQveCfGfryNRN9w",
//   //   "sd_array",
//   //   [
//   //     32,
//   //     23
//   //   ]
//   // ]
//   const theirsDecoded = new TextDecoder().decode(base64url.decode(encodedFromPython))
//   const mineDecoded = new TextDecoder().decode(base64url.decode(encoded))
//   console.warn(theirsDecoded)
//   console.warn(mineDecoded)
//   disclosureHash = '0L4NSi1iP7pNwrkqqc63NcfnPJkSzSV6Rg2h3TlPoQw' 
// }

// if (disclosureHash === 'OgGrwYNbIl-IXiBIM6FmIBGRijN27IATvn0pPyxt9UQ'){
//   console.log(salt, source)

//   // WyJlbHVWNU9nM2dTTklJOEVZbnN4QV9BIiwgbnVsbF0 
//   // [
//   //   "eluV5Og3gSNII8EYnsxA_A",
//   //   null
//   // ]
  
//   // WyIyR0xDNDJzS1F2ZUNmR2ZyeU5STjl3IiwgbnVsbF0
//   // [
//   //   "2GLC42sKQveCfGfryNRN9w",
//   //   null
//   // ]

//   // const encodedFromPython = `WyIyR0xDNDJzS1F2ZUNmR2ZyeU5STjl3IiwgInNkX2FycmF5IiwgWzMyLCAyM11d`
//   // // [
//   // //   "2GLC42sKQveCfGfryNRN9w",
//   // //   "sd_array",
//   // //   [
//   // //     32,
//   // //     23
//   // //   ]
//   // // ]
//   // const theirsDecoded = new TextDecoder().decode(base64url.decode(encodedFromPython))
//   // const mineDecoded = new TextDecoder().decode(base64url.decode(encoded))
//   // console.warn(theirsDecoded)
//   // console.warn(mineDecoded)
//   // disclosureHash = 'OgGrwYNbIl-IXiBIM6FmIBGRijN27IATvn0pPyxt9UQ' 
// }