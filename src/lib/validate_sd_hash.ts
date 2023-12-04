

import { sd_hash } from "./sd_hash"

export const validate_sd_hash = async (presentation_token: string, key_binding_sd_hash: string, debug = false ): Promise<void> => {
  const parts = presentation_token.split('~')
  const kbt = parts.pop()
  const presented_token  = parts.join('~') + '~'
  const presentation_digest = await sd_hash.compute(presented_token)
  const isPresentedTokenCommitedToInKeyBindingToken = presentation_digest === key_binding_sd_hash
  if (debug){
    console.info("Key Binding Token sd_hash matches presentation token")
  }
  if (!isPresentedTokenCommitedToInKeyBindingToken){
    throw new Error("Key Binding Token sd_hash does not match presentation token")
  }
}