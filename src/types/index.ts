
import { CompactJWSHeaderParameters } from "jose"

import { YAMLMap } from "yaml"

export type PublicKeyJwk = Record<string, unknown> & { alg?: string }
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
  _sd_alg ?: string
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

export type VerifierCtx = {
  alg: string
  digester: Digester
  verifier: Verifier
}

export type ParsedSdJwt = {
   jwt: string
   kbt?:string
   disclosures?: string[]
}

export type RequestPresentationVerify = {
  presentation: string
  aud ?: string
  nonce ?: string
}

export type RequestV2Verifier = { 
  alg?: string
  digester?: Digester
  verifier?: Verifier
  publicKeyJwk?: PublicKeyJwk 
}

export type V1VerifierConstructor = { 
  alg: string
  digester: Digester
  verifier: Verifier
}

export type RequestV2Issuer = { 
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

export type V1IssuerConstructor = { 
  alg: string 
  iss: string  
  digester: Digester  
  salter: Salter 
  signer: Signer
}

export type RequestV2Holder = { 
  alg?: string 
  iss?: string  
  digester?: Digester  
  salter?: Salter 
  signer?: Signer
  secretKeyJwk?: SecretKeyJwk 
}

export type V1HolderConstructor = { 
  alg: string 
  iss: string  
  digester: Digester  
  salter: Salter 
  signer: Signer
}
