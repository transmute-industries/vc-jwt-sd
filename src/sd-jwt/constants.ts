export const DEFAULT_SIGNING_ALG = "ES256"
export const SD_DIGESTS_KEY = "_sd"
export const DIGEST_ALG_KEY = "_sd_alg"
export const SD_LIST_PREFIX = "..."
export const COMBINED_serialization_FORMAT_SEPARATOR = "~"

export const KB_JWT_TYP_HEADER = "kb+jwt"
export const SDJWTHasSDClaimException = `Input data contains the special claim '${SD_DIGESTS_KEY}' reserved for SD-JWT internal data.`

export const UnexpectedSDObjException = `Input data contains a claim value that should not be wrapped by SDObj.`