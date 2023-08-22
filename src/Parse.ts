
import { base64url, decodeJwt } from 'jose'
import { COMBINED_serialization_FORMAT_SEPARATOR } from './constants'

import { ParsedSdJwt } from './types'

const compact = (jws: string, options = { decodeDisclosure: false })=>{
  const components = jws.split(COMBINED_serialization_FORMAT_SEPARATOR)
  const jwt = components.shift()
  const result = { jwt } as ParsedSdJwt
  if (components[components.length-1].includes('.')){
    result.kbt =  components.pop()
  }
  if (components.length){
    result.disclosures = components.filter((d)=>{
      return d.length > 0
    })
  }
  if (options.decodeDisclosure){
    result.disclosures = result.disclosures?.map((d)=>{
      return JSON.parse(new TextDecoder().decode(base64url.decode(d)))
    })
  }
  return result
}

const expload = async (jws: string, config: any)=>{
  const parsed = compact(jws) as any
  const decodedIssuance = decodeJwt(parsed.jwt)
  parsed.issued = decodedIssuance

  const hash = config.digester
  const hashToDisclosureMap = {} as any
  const hashToEncodedDisclosureMap = {} as any
  for (const encoded of parsed.disclosures){
    const hashed = await hash.digest(encoded)
    hashToEncodedDisclosureMap[hashed] = encoded
    hashToDisclosureMap[hashed] =  JSON.parse(new TextDecoder().decode(base64url.decode(encoded)))
  }
 
  parsed.disclosureMap = hashToDisclosureMap
  parsed.hashToEncodedDisclosureMap = hashToEncodedDisclosureMap
  return parsed
}



const Parse = {compact, expload}

export default Parse