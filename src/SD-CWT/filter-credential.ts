
import {sdCwtMapProp, sdCwtArrayProp} from './yaml-to-cbor'

export type WalkMapConfig = { 
  disclosures: Map<string, any[]>
}

const walkList = async (claimsList: any[], revealList: any[], config: WalkMapConfig)=>{
  for (const key in claimsList) {
    const value = claimsList[key]
    const revealValue = revealList ? revealList[key] : value
    if (value instanceof Map){
      const item = value.get(sdCwtArrayProp)
      if (item){
        const disclosureDigest = item.toString('hex')
        if (!revealValue){
          config.disclosures.delete(disclosureDigest)
        }
      } else {
        await walkMap(value, revealValue, config)
      }
    } else if (value instanceof Array){
      await walkList(value, revealValue, config)
    } else {
      // console.log('walkList ', key,  value)
    }
  }
}

const walkMap = async (claimsMap: Map<any, any>, revealMap: Map<any, any>,  config: WalkMapConfig)=>{

  for (const [key, value] of claimsMap) {
    let revealValue = revealMap.get(key)
    if (key === sdCwtMapProp){
      const [digest] = value 
      const disclosureDigest = digest.toString('hex')
      const disclosed = config.disclosures.get(disclosureDigest)
      const [salt, dataKey, dataValue] = disclosed as any[]
      revealValue = revealMap.get(dataKey)
      if (!revealValue){
        config.disclosures.delete(disclosureDigest)
      }
    } else if (value instanceof Map){
      await walkMap(value, revealValue, config)
    } else if (value instanceof Array){
      await walkList(value, revealValue, config)
    } else {
      // console.log('walkMap ', key, value)
    }
  }
}


const filterCredential = async (claimsMap: Map<any, any>, revealMap: Map<any, any>, disclosureMap: Map<string, any[]>): Promise<Map<any, any>> => {
  const config = { disclosures: disclosureMap }
  await walkMap(claimsMap, revealMap, config)
  return claimsMap
}

export default filterCredential