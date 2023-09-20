import * as EcdsaMultikey from '@digitalbazaar/ecdsa-multikey';
import { createSignCryptosuite }
  from '@digitalbazaar/ecdsa-sd-2023-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import jsigs from 'jsonld-signatures';

const { purposes: { AssertionProofPurpose } } = jsigs;

const contextShim = {
  "@context": {
    "@vocab": "https://www.w3.org/ns/credentials/examples#"
  }
}

const contexts = ['https://www.w3.org/ns/credentials/v2', 'https://www.w3.org/ns/credentials/examples/v2']

const documentLoader = (id: string) => {
  if (contexts.includes(id)) {
    return { document: contextShim }
  }
  console.error(id)
  throw new Error('unsupported id: ' + id)
}

export const createDiIssuanceHelper = async (ex: {example: any, pointers: string[], disclosable: string}) => {
  const keyPair = await EcdsaMultikey.generate({ curve: 'P-256' });
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: createSignCryptosuite({
      mandatoryPointers: ex.pointers
    })
  });
  return async () => {
    await jsigs.sign(ex.example, {
      suite,
      purpose: new AssertionProofPurpose(),
      documentLoader
    });
  }

}