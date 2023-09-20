import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import { createSignCryptosuite, createDiscloseCryptosuite }
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

import v2 from './v2.context.json'

const { purposes: { AssertionProofPurpose } } = jsigs;

const contexts = {
  'https://www.w3.org/ns/credentials/v2': v2,
  'https://www.w3.org/ns/credentials/examples/v2': {
    "@context": {
      // "@vocab": "https://www.w3.org/ns/credentials/examples#"
    }
  }
} as Record<string, unknown>

const documentLoader = (id: string) => {
  if (contexts[id]) {
    return { document: contexts[id] }
  }
  console.error(id)
  throw new Error('unsupported id: ' + id)
}

export const createDiIssuanceHelper = async (ex: { example: any, mandatoryPointers: string[], selectivePointers: string[], disclosable: string }) => {
  const keyPair = await EcdsaMultikey.generate({ curve: 'P-256' });
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: createSignCryptosuite({
      mandatoryPointers: ex.mandatoryPointers
    })
  });
  return async () => {
    await jsigs.sign(structuredClone(ex.example), {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });
  }
}

export const createDiPresentationHelper = async (ex: { example: any, mandatoryPointers: string[], selectivePointers: string[], disclosable: string }) => {
  const keyPair = await EcdsaMultikey.generate({ curve: 'P-256' });
  const suite1 = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: createSignCryptosuite({
      mandatoryPointers: ex.mandatoryPointers
    })
  });
  const vc = await jsigs.sign(structuredClone(ex.example), {
    suite: suite1,
    purpose: new AssertionProofPurpose(),
    documentLoader
  })
  const suite2 = new DataIntegrityProof({
    cryptosuite: createDiscloseCryptosuite({
      selectivePointers: ex.selectivePointers
    })
  });
  return async () => {
    const derivedCredential = await jsigs.derive(structuredClone(vc), {
      suite: suite2,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });
    // console.log(JSON.stringify(derivedCredential, null, 2))
  }
}


