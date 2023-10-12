
import { SD_DIGESTS_KEY, SD_LIST_PREFIX, DIGEST_ALG_KEY } from './constants'

// TODO refactor this as a walk with state....
const itemHasDisclosure = (item: any) => {
  return (
    item !== null && 
    typeof item === "object" &&
    Object.keys(item).length === 1 &&
    item[SD_LIST_PREFIX] !== undefined &&
    typeof item[SD_LIST_PREFIX] === "string"
  );
};

const _rec_unpack_disclosed_claims = (claimset: any, state: any):any => {
  if (Array.isArray(claimset)){
    const output = []
    for (const element of claimset){
      if(itemHasDisclosure(element)){
        const digest_to_check = element[SD_LIST_PREFIX]
        if (state._hash_to_decoded_disclosure[digest_to_check]){
          const [salt, value] = state._hash_to_decoded_disclosure[digest_to_check]
          output.push(_rec_unpack_disclosed_claims(value, state))
        }
      } else {
        output.push(_rec_unpack_disclosed_claims(element, state))
      }
    }
    return output
  } else if (claimset !== null && typeof claimset === 'object') {
    const pre_output = {} as any
    for (const [key, value] of Object.entries(claimset) as any) {
      if (key !== SD_DIGESTS_KEY && key !== DIGEST_ALG_KEY){
        pre_output[key] = _rec_unpack_disclosed_claims(value, state)
      }
    }
    // 
    for (const digest of claimset[SD_DIGESTS_KEY] || [] ){
      if (state._duplicate_hash_check[digest]){
        throw new Error(`Duplicate hash found in SD-JWT: ${digest}`)
      }
      state._duplicate_hash_check.push(digest)
      if (state._hash_to_decoded_disclosure[digest]){
        const [salt, key, value] = state._hash_to_decoded_disclosure[digest]
        if (pre_output[key]){
          throw new Error(`Duplicate key found when unpacking disclosed claim: '${key}' in ${pre_output}. This is not allowed.`)
        }
        const unpacked_value = _rec_unpack_disclosed_claims(value, state)
        pre_output[key] = unpacked_value
      }
    }
    return pre_output
  } else {
    return claimset
  }
}

const _unpack_disclosed_claims = (claimset: any, state: any) => {
  state._duplicate_hash_check = []
  return _rec_unpack_disclosed_claims(claimset, state)
}

 export default _unpack_disclosed_claims