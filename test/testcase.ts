import fs from "fs";
import crypto from "crypto";
import { Pair, Scalar, parse } from "yaml";
import { base64url, decodeJwt, decodeProtectedHeader } from "jose";

import YAML from "../src/YAML-SD";
import Parse from "../src/Parse";

const digester = (name: 'sha-256' = 'sha-256') => {
  if (name !== 'sha-256'){
    throw new Error('hash function not supported')
  }
  return {
    name,
    digest: (json: string) => {
      return base64url.encode(crypto.createHash("sha256").update(json).digest());
    }
  };
};

const getSpec = (path: string) => {
  const spec = fs.readFileSync(path, "utf8");
  const doc = YAML.parseCustomTags(spec);
  return doc as any;
};

const decodeToken = (jws: string) => {
  const protectedHeader = decodeProtectedHeader(jws);
  const payload = decodeJwt(jws);
  return { protectedHeader, payload };
};

const decodeIssuanceForm = (sdJwt: string) => {
  const parsed = Parse.compact(sdJwt);
  const parsedDecoded = Parse.compact(sdJwt, { decodeDisclosure: true });
  const saltMap: any = {};
  parsed.disclosures?.forEach((item) => {
    const parsed = JSON.parse(new TextDecoder().decode(base64url.decode(item)));
    let withoutSalt: any = [];
    if (parsed.length === 2) {
      withoutSalt = [parsed[1]];
    } else {
      withoutSalt = [parsed[1], parsed[2]];
    }
    const saltKey = base64url.encode(JSON.stringify(withoutSalt));
    if (!saltMap[saltKey]){
      saltMap[saltKey] = parsed[0];
    } else {
      if (Array.isArray(saltMap[saltKey])){
        saltMap[saltKey].push(parsed[0])
      } else {
        saltMap[saltKey] = [saltMap[saltKey]]
        saltMap[saltKey].push(parsed[0])
      }
    }
 
  });
  return {
    parsed,
    parsedDecoded,
    decoded: decodeToken(parsed.jwt),
    saltMap,
  };
};

const decodeExpectedIssuance = (path: string) => {
  const parsedIssuance = fs.readFileSync(path, "utf8").split("\n").join("");
  return decodeIssuanceForm(parsedIssuance);
};

const getUserClaims = (path: string) => {
  const user_claims = JSON.parse(fs.readFileSync(path, "utf8").toString());
  return user_claims;
};

const getSalter = (pathToDoc: string) => {
  const doc = decodeExpectedIssuance(pathToDoc);
  const salter = (pair?: any) => {
    let withoutSalt;
    if (pair instanceof Pair) {
      withoutSalt = [pair.key.value, JSON.parse(JSON.stringify(pair.value))];
    } else if (pair instanceof Scalar) {
      withoutSalt = [JSON.parse(JSON.stringify(parse(pair.value)))];
    } else {
      withoutSalt = [JSON.parse(JSON.stringify(pair))];
    }
    const saltKey = base64url.encode(JSON.stringify(withoutSalt));
    if (Array.isArray(doc.saltMap[saltKey])){
      return doc.saltMap[saltKey].shift()
    }
    return doc.saltMap[saltKey];
  };
  return salter;
};

const getExpectedPayload = (pathToPayload: string) => {
  const expectedPayload = JSON.parse(
    fs.readFileSync(pathToPayload, "utf8").toString()
  );
  delete expectedPayload["iss"];
  delete expectedPayload["iat"];
  delete expectedPayload["exp"];
  delete expectedPayload["_sd_alg"];
  return expectedPayload;
};

const api = {
  digester,
  getExpectedPayload,
  getSpec,
  getSalter,
  decodeIssuanceForm,
  decodeExpectedIssuance,
  getUserClaims,
};

export default api;
