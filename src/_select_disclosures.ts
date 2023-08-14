import { SD_DIGESTS_KEY, SD_LIST_PREFIX } from "./constants";
import { SdHolderState } from "./types";

const itemHasDisclosure = (item: any) => {
  return (
    typeof item === "object" &&
    Object.keys(item).length === 1 &&
    item[SD_LIST_PREFIX] !== undefined &&
    typeof item[SD_LIST_PREFIX] === "string"
  );
};

const _select_disclosures_list = (
  sd_jwt_claims: any,
  claims_to_disclose: any,
  state: SdHolderState
) => {
  if (claims_to_disclose === null || claims_to_disclose === undefined) {
    return [];
  }
  if (claims_to_disclose === true) {
    claims_to_disclose = [];
  }
  if (!Array.isArray(claims_to_disclose)) {
    throw new Error(
      "To disclose array elements, an array must be provided as disclosure information."
    );
  }
  for (const index in sd_jwt_claims as any[]) {
    const element = sd_jwt_claims[index]
    let claims_to_disclose_element = claims_to_disclose[index]
    
    if (itemHasDisclosure(element)) {
      const digest_to_check = element[SD_LIST_PREFIX]
      if (!state._hash_to_decoded_disclosure[digest_to_check]){
        // fake digest
        continue
      } 
      const [salt, disclosure_value ] = state._hash_to_decoded_disclosure[digest_to_check]
      if ( claims_to_disclose_element === false || claims_to_disclose_element === undefined){
        continue
      }
      state.hs_disclosures.push(state._hash_to_disclosure[digest_to_check])
      if (Array.isArray(disclosure_value)){
        if (claims_to_disclose_element === true){
          claims_to_disclose_element = []
        }
        if (typeof claims_to_disclose_element !== 'object'){
          throw new Error('To disclose array elements nested in arrays, provide an array (can be empty).')
        }
        _select_disclosures(disclosure_value, claims_to_disclose_element, state)
      } else if (typeof disclosure_value === 'object'){
        if (claims_to_disclose_element === true){
          claims_to_disclose_element = {}
        }
        if (typeof claims_to_disclose_element !== 'object'){
          throw new Error('To disclose object elements in arrays, provide an object (can be empty).')
        }
        _select_disclosures(disclosure_value, claims_to_disclose_element, state)
      }
    } else {
      _select_disclosures(element, claims_to_disclose_element, state)
    }
  }
};

const _select_disclosures_dict = (
  sd_jwt_claims: any,
  claims_to_disclose: any,
  state: SdHolderState
) => {
  if (claims_to_disclose === null || claims_to_disclose === undefined) {
    return {};
  }
  if (claims_to_disclose === true) {
    claims_to_disclose = {};
  }
  if (typeof claims_to_disclose !== "object") {
    throw new Error(
      "To disclose object elements, an object must be provided as disclosure information."
    );
  }

  for (const [key, value] of Object.entries(sd_jwt_claims) as any) {
    if (key === SD_DIGESTS_KEY) {
      // console.log(key, value, claims_to_disclose)
      for (const digest_to_check of value) {
        if (state._hash_to_decoded_disclosure[digest_to_check] === undefined) {
          // # fake digest
          continue;
        }
        const [salt, key, value] =
          state._hash_to_decoded_disclosure[digest_to_check];
        try {
          if (claims_to_disclose[key]) {
            state.hs_disclosures.push(
              state._hash_to_disclosure[digest_to_check]
            );
          } else {
            // nop
          }
        } catch (e) {
          throw new Error(
            "claims_to_disclose does not contain a dict where a dict was expected (found {claims_to_disclose} instead)"
          );
        }
        _select_disclosures(value, claims_to_disclose[key], state);
      }
    } else {
      _select_disclosures(value, claims_to_disclose[key], state);
    }
  }
};

export default function _select_disclosures(
  sd_jwt_claims: any,
  claims_to_disclose: any,
  state: SdHolderState
): any {
  if (Array.isArray(sd_jwt_claims)) {
    _select_disclosures_list(sd_jwt_claims, claims_to_disclose, state);
  } else if (sd_jwt_claims !== null && typeof sd_jwt_claims === "object") {
    _select_disclosures_dict(sd_jwt_claims, claims_to_disclose, state);
  } else {
    // pass

  }
}
