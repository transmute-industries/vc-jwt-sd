
import {sdCwtMapProp, sdCwtArrayProp} from './yaml-to-cbor'

export type WalkMapConfig = { 
  disclosures: Map<string, any[]>
}

const walkList = async (list: any[], config: WalkMapConfig)=>{
  for (const key in list) {
    const value = list[key]
    if (value instanceof Map){
      const item = value.get(sdCwtArrayProp)
      if (item){
        list.splice(parseInt(key, 10), 1)
        const disclosedDigest = item.toString('hex')
        const disclosed = config.disclosures.get(disclosedDigest)
        if (!disclosed){
          // console.log('skipping undisclosed', value)
          continue
        }
        const [salt, dataValue] = disclosed as any[]
        list[key] = dataValue
      } else {
        await walkMap(value, config)
      }
    } else if (value instanceof Array){
      await walkList(value, config)
    } else {
      // console.log('walkList ', key,  value)
    }
  }
}

const walkMap = async (map: Map<any, any>, config: WalkMapConfig)=>{
  for (const [key, value] of map) {
    if (key === sdCwtMapProp){
      map.delete(key)
      const [digest] = value 
      const disclosedDigest = digest.toString('hex')
      const disclosed = config.disclosures.get(disclosedDigest)
      if (!disclosed){
        // console.log('skipping undisclosed', value)
        continue
      }
      const [salt, dataKey, dataValue] = disclosed as any[]
      map.set(dataKey, dataValue)
    } else if (value instanceof Map){
      await walkMap(value, config)
    } else if (value instanceof Array){
      await walkList(value, config)
    } else {
      // console.log('walkMap ', key, value)
    }
  }
}


const postVerifyProcessing = async (map: Map<any, any>, disclosures: Map<string, any[]>): Promise<Map<any, any>> => {
  const config = { disclosures }
  await walkMap(map, config)
  return map
}

export default postVerifyProcessing