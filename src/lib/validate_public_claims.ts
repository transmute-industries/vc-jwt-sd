import moment from "moment"

const acceptableAud = (expectedAud: string, receivedAud: string | string[]): boolean => {
  return Array.isArray(receivedAud) ? receivedAud.includes(expectedAud) : receivedAud === expectedAud
}

export const validate_public_claims = (token_name: string, claimset: any, options: any)=>{
  const { debug, reference_audience, reference_nonce} = options;
  const { iat, nbf, exp, aud, nonce } = claimset

  if (aud){
    if (!reference_audience || !acceptableAud(reference_audience, aud)){
      throw new Error(`${token_name} presented audience does not match reference value: ${reference_audience}`)
    }
  }

  if (nonce !== undefined){
    if (reference_nonce !== nonce){
      throw new Error(`${token_name} presented nonce does not match reference value: ${reference_nonce}`)
    }
  }

  const now = moment()

  if (iat){
    const issuanceTime = moment.unix(iat)
    const isIssuedInFuture = now.isBefore(issuanceTime)
    if (debug){
      console.info(`${token_name} issued`, issuanceTime.fromNow())
    }
    if (isIssuedInFuture){
      throw new Error(`${token_name} cannot be issued in the future...` + issuanceTime.fromNow())
    }
  } else {
    if (debug){
      console.info(`${token_name} has no issuance time`)
    }
  }
  if (nbf){
    const activationTime = moment.unix(nbf)
    const isActivationInFuture = now.isBefore(activationTime)
    if (debug){
      console.info(`${token_name} activated`, activationTime.fromNow())
    }
    if (isActivationInFuture){
      throw new Error(`${token_name} cannot be activated in the future...` + activationTime.fromNow())
    }
  } else {
    if (debug){
      console.info(`${token_name} has no activation time`)
    }
  }
  if (exp){
    const expirationTime = moment.unix(exp)
    const isExpirationInPast = now.isAfter(expirationTime)
    if (debug){
      console.info(`${token_name} expires`, expirationTime.fromNow())
    }
    if (isExpirationInPast){
      throw new Error(`${token_name} cannot be expired in the past...` + expirationTime.fromNow())
    }
  } else {
    if (debug){
      console.info(`${token_name} has no expiration time`)
    }
  }
}