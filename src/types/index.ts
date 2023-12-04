
import { CompactJWSHeaderParameters } from "jose"

import { YAMLMap } from "yaml"

export type EncodedJwtHeader = string
export type EncodedJwtPayload = string
export type EncodedJwtSignature = string
export type IssuedJwt = `${EncodedJwtHeader}.${EncodedJwtPayload}.${EncodedJwtSignature}`
export type EncodedSdJwtDisclosures = string
export type KeyBindingToken = `${EncodedJwtHeader}.${EncodedJwtPayload}.${EncodedJwtSignature}`

export type IssuedSdJwt = `${IssuedJwt}~${EncodedSdJwtDisclosures}`
export type IssuedCompactSdJwt = IssuedSdJwt | string
export type PresentedSdJwtWithoutKeyBinding = `${IssuedCompactSdJwt}`
export type PresentedSdJwtWithKeyBinding = `${PresentedSdJwtWithoutKeyBinding}~${KeyBindingToken}`
export type PresentedCompactSdJwt = PresentedSdJwtWithoutKeyBinding | PresentedSdJwtWithKeyBinding | string

export type PublicKeyJwk = Record<string, unknown> & { kid?: string, kty?: string, alg?: string }
export type PrivateKeyJwk = PublicKeyJwk & { d?: string }
export type SecretKeyJwk = PrivateKeyJwk

export type JwtClaimset = Record<string, unknown>
export type YamlMapClaimset = YAMLMap
export type YamlMapDisclosure = YAMLMap

export type RequestIssuance = {
  iat?: number
  exp?: number
  claims: YamlMapClaimset
  holder?: PublicKeyJwk
}

export type SignParams = {
  protectedHeader: CompactJWSHeaderParameters
  claimset: JwtClaimset
}

export type CompactSign = ({protectedHeader, claimset}: SignParams) => Promise<string>

export type Signer = { sign: CompactSign }

export type CompactVerify = (jws: string) => Promise<SignParams>

export type Verifier = { verify: CompactVerify }

export type Digester = { name: string,  digest: (json: string) => Promise<string> }

export type Salter = () => Promise<string>

export type IssuerCtx = {
  iss?: string,
  alg: string,
  kid?: string,
  typ?: string,
  cty?: string,
  digester: Digester,
  signer: Signer
  salter: Salter
}

export type Settings = {
  identifiers: {
    issuer: string
    verifier: string
  },
  key_settings: {
    key_size: number
    kty: string
    issuer_key: PrivateKeyJwk
    holder_key: PrivateKeyJwk
  }
  key_binding_nonce: string
  expiry_seconds: number
  random_seed: number
  iat: number
  exp: number
}

export type Spec = {
  user_claims: YAMLMap
  holder_disclosed_claims: YAMLMap
  key_binding: boolean
}

export type HolderCtx = {
  alg: string
  iss?: string
  kid?: string
  digester: Digester
  signer?: Signer
}

export type RequestPresentation = {
  credential: string
  disclosure: YamlMapDisclosure
  aud?: string | string[]
  nonce?: string | number
}

export type DisclosureHash = string; // base64url encoded
export type DisclosureEncoding = string; // base64url encoded
export type ObjectMapHashToDisclosure = Record<DisclosureHash, DisclosureEncoding>
export type DisclosureArray = Array<any>;
export type ObjectMapHashToDecodedDisclosure = Record<DisclosureHash, DisclosureArray>

export type SdHolderState = {
  hs_disclosures: string[]
  _hash_to_disclosure: ObjectMapHashToDisclosure
  _hash_to_decoded_disclosure: ObjectMapHashToDecodedDisclosure
}

export type ParsedSdJwt = {
  jwt: string
  kbt?:string
  disclosures?: string[]
}

export type VerifierCtx = {
  alg: string
  digester: Digester
  verifier: Verifier
  resolver?: Resolver
  debug ?: boolean
}

export type RequestPresentationVerify = {
  presentation: string
  aud ?: string
  nonce ?: string
}


export type RequestIssuer = { 
  alg?: string 
  iss?: string  
  kid?: string 
  typ?: string 
  cty?: string 
  digester?: Digester  
  salter?: Salter 
  signer?: Signer
  secretKeyJwk?: SecretKeyJwk 
}



export type RequestHolder = { 
  alg?: string 
  iss?: string  
  kid?: string  
  digester?: Digester  
  salter?: Salter 
  signer?: Signer
  secretKeyJwk?: SecretKeyJwk 
}

export type Resolver = {
  resolve: (token: string)=> Promise<PublicKeyJwk>
}

export type RequestVerifier = { 
  alg?: string
  digester?: Digester
  verifier?: Verifier
  resolver?: Resolver,
  publicKeyJwk?: PublicKeyJwk 

  debug ?: boolean
}

export type PublicHeaderClaimset = {
  alg: string
  kid?: string
  typ?: string
  cty?: string
  jwk ?: PublicKeyJwk
} & Record<string, any>

export type SdJwtProtectedHeader = PublicHeaderClaimset 

export type Confirmation = {
  jwk ?: PublicKeyJwk
  kid ?: string
  jkt ?: string
}

export type ValidatePublicClaimsOptions = {
  debug ?: boolean
  reference_audience ?: string
  reference_nonce ?: string
}

export type JsonSerializedSdJwt = {
  protected: string
  payload: string
  signature: string
}

export type PublicPayloadClaimset = {
  
  iss?:string
  sub?:string
  iat?:number
  nbf?:number
  exp?:number
  cnf?:Confirmation
  aud?: string | string[]
  nonce?: string

  sd_hash ?:string
  _sd ?: string[]
  _sd_alg ?: "sha-256" | string
  _sd_jwt ?: string
  _js_sd_jwt ?: JsonSerializedSdJwt
  disclosures ?: string[]
  type ?: string | string[]

} & Record<string, any>

export type SdJwtProtectedPayload = PublicPayloadClaimset

export type VerifiedSdJwt = {
  protectedHeader: SdJwtProtectedHeader,
  claimset: SdJwtProtectedPayload
}

export type VerifiedTokensWithKeyBinding = {
  protectedHeader: SdJwtProtectedHeader,
  claimset: SdJwtProtectedPayload & { cnf :Confirmation}
}