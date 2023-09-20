import pointer from 'json-pointer'
import yaml, { YAMLMap, YAMLSeq } from 'yaml'

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
        "lang": `test lang ${i}`,
        "dir": i % 2 === 0 ? "rtl" : "ltr"
      }
    })
}

const createPointers = (length: number) => {
  const mandatoryPointers = new Array(length)
  .fill(0).map((v, i) => {
    return `/issuer/name/${i}`
  })
  return mandatoryPointers.filter((v, i)=>{
    return i % 2 !== 0;
  })
}

const createDisclosableExample = (example: any, length: number) => {
  const disclosable = yaml.stringify(example)
  const parsed = yaml.parseDocument(disclosable) as { contents: YAMLMap}
  const issuer = parsed.contents.get('issuer') as YAMLMap
  const names = issuer.get('name') as YAMLSeq<YAMLMap>
  for (const index in names.items){
    if (parseInt(index) % 2 !== 0){
      names.items[index].tag = '!sd'
    }
  }
  return yaml.stringify(parsed)
}

export const getExample = (length: number) => {
  const clone = structuredClone(i18nTestCase);
  const issuerNames =  createTestValues(length)
  pointer.set(clone, '/issuer/name', issuerNames);
  const pointers = createPointers(length)
  const disclosable = createDisclosableExample(clone, length)
  return { example: clone, pointers, disclosable };
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