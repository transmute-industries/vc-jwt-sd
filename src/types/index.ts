
import { CompactJWSHeaderParameters } from "jose"

export type PublicKeyJwk = Record<any, unknown> & { alg?: string }
export type PrivateKeyJwk = PublicKeyJwk & { d?: string }

export type JwtClaimset = Record<string, unknown>
export type YamlMapClaimset = Record<any, unknown>

export type RequestIssuance = {
  iat?: number
  exp?: number
  claims: YamlMapClaimset | any
  holder?: PublicKeyJwk
}

export type SignParams = {
  protectedHeader: CompactJWSHeaderParameters
  claimset: JwtClaimset
}

export type CompactSign = ({protectedHeader, claimset}: SignParams) => Promise<string>
export type CompactSigner = { sign: ({protectedHeader, claimset}: SignParams) => Promise<string> }
export type CompactVerify = { verify: (jws: string) => Promise<SignParams> }

export type Digester = { name: string,  digest: (json: string) => Promise<string> }

export type Salter = () => Promise<string>

export type SdJwtSalter = () => Promise<string>



export type IssuerCtx = {
  iss?: string,
  _sd_alg ?: string
  alg: string,
  kid?: string,
  typ?: string,
  cty?: string,
  digester: Digester,
  signer: CompactSigner
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
  user_claims: any
  holder_disclosed_claims: any
  key_binding: boolean
}

export type HolderCtx = {
  alg: string
  digester: Digester
  signer?: CompactSigner
}

export type RequestPresentation = {
  credential: string
  disclosure: any
  aud?: string | string[]
  nonce?: string | number
}

export type SdHolderState = {
  hs_disclosures: any[]
  _hash_to_disclosure: any
  _hash_to_decoded_disclosure: any
  
}

export type VerifierCtx = {
  alg: string
  digester: Digester
  verifier: CompactVerify
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
  verifier?: any
  publicKeyJwk?: any 
}

export type V1VerifierConstructor = { 
  alg: string
  digester: Digester
  verifier: {
    verify: (token: string)=> Promise<any>
  }
}


export type RequestV2Issuer = { 
  alg?: string 
  iss?: string  
  kid?: string 
  typ?: string 
  cty?: string 
  digester?: Digester  
  salter?: SdJwtSalter 
  signer?: CompactSigner
  secretKeyJwk?: any 
}

export type V1IssuerConstructor = { 
  alg: string 
  iss: string  
  digester: Digester  
  salter: SdJwtSalter 
  signer: CompactSigner
}

export type RequestV2Holder = { 
  alg?: string 
  iss?: string  
  digester?: Digester  
  salter?: SdJwtSalter 
  signer?: CompactSigner
  secretKeyJwk?: any 
}

export type V1HolderConstructor = { 
  alg: string 
  iss: string  
  digester: Digester  
  salter: SdJwtSalter 
  signer: CompactSigner
}
