import pointer from 'json-pointer'
import yaml, { Scalar, YAMLMap, YAMLSeq } from 'yaml'

// Example modified from https://w3c.github.io/vc-data-model/#example-usage-of-the-name-and-description-property-0
const i18nTestCase = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://www.w3.org/ns/credentials/examples/v2"
  ],
  "id": "http://university.example/credentials/3732",
  "type": ["VerifiableCredential", "ExampleDegreeCredential"],
  "issuer": {
    "id": "https://university.example/issuers/565049",
    "name": [{
      "value": "Example University",
      "lang": "en"
    }, {
      "value": "Université de Exemple",
      "lang": "fr"
    }, {
      "value": "جامعة المثال",
      "lang": "ar",
      "dir": "rtl"
    }],
  },
  "validFrom": "2015-05-10T12:30:00Z",
  "credentialSubject": {
    "id": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "degree": {
      "type": "ExampleBachelorDegree",
      "subtype": "Bachelor of Science and Arts"
    }
  }
}

const createTestValues = (length: number) => {
  return new Array(length)
    .fill(0).map((v, i) => {
      return {
        "value": `test value ${i}`,
        // see https://github.com/digitalbazaar/ecdsa-sd-2023-cryptosuite/issues/11
        "lang": `en`,
        // "dir": i % 2 === 0 ? "rtl" : "ltr"
      }
    })
}

const createMandatoryPointers = (example: any) => {
  const allPointers = Object.keys(pointer.dict(example))
  return allPointers.filter((v, i)=>{
    const isIssuerName = v.startsWith('/issuer/name/')
    if (isIssuerName){
      const indexInt = parseInt(v.split('/')[3])
      return indexInt % 2 === 0
    }
    return true
  })
}

const createSelectivePointers = (example: any) => {
  const allPointers = Object.keys(pointer.dict(example))
  return allPointers.filter((v, i)=>{
    const isIssuerName = v.startsWith('/issuer/name/')
    if (isIssuerName){
      const indexInt = parseInt(v.split('/')[3])
      return indexInt % 3 === 0
    }
    return true
  })
}

const createDisclosableExample = (example: any, length: number) => {
  const disclosable = yaml.stringify(example)
  const parsed = yaml.parseDocument(disclosable) as { contents: YAMLMap}
  const issuer = parsed.contents.get('issuer') as YAMLMap
  const names = issuer.get('name') as YAMLSeq<YAMLMap>
  for (const index in names.items){
    const indexInt = parseInt(index)
    if (indexInt % 2 !== 0){
      names.items[index].tag = '!sd'
    }
  }
  return yaml.stringify(parsed)
}

const createDisclosureExample = (disclosable: string) => {
  const parsed = yaml.parseDocument(disclosable) as { contents: YAMLMap}
  const issuer = parsed.contents.get('issuer') as YAMLMap
  const names = issuer.get('name') as YAMLSeq<YAMLMap>
  for (const index in names.items){
    const indexInt = parseInt(index)
    if (names.items[index].tag === '!sd'){
      if (indexInt % 3 === 0){
        names.items[index] = new Scalar(true) as any
      } else {
        names.items[index] = new Scalar(false) as any
      }
      delete names.items[index].tag
    }
  }
  return yaml.stringify(parsed)
}

export const getExample = (length: number) => {
  const clone = structuredClone(i18nTestCase);
  const issuerNames =  createTestValues(length)
  pointer.set(clone, '/issuer/name', issuerNames);
  const mandatoryPointers = createMandatoryPointers(clone)
  const selectivePointers = createSelectivePointers(clone)
  const disclosable = createDisclosableExample(clone, length)
  const disclosure = createDisclosureExample(disclosable)
  return { example: clone, mandatoryPointers, selectivePointers, disclosable, disclosure };
}


export const averageExecutionTime = async (asyncFunc: Function) => {
  let numberTrials = 5;
  const startTime = Date.now();
  for (let i = 0; i < numberTrials; i++){
    await asyncFunc();
  }
  const msElapsed = Date.now() - startTime;
  return msElapsed / numberTrials;
}