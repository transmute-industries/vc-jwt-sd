import {
  Pair,
  Scalar,
  YAMLMap,
  YAMLSeq,
  stringify,
} from "yaml";

import { discloseTag } from "./constants";

import { parseCustomTags } from "./parseCustomTags";
import { yamlOptions } from './yamlOptions'

const fakePair = (sourcePair: Pair) =>{
  let fake;
  if (sourcePair.value instanceof Scalar) {
    fake = { value: new Scalar(false) };
  }
  if (sourcePair.value instanceof YAMLSeq) {
    fake = {
      value: fakeSequence(sourcePair.value.items.length),
    };
  }
  if (sourcePair.value instanceof YAMLMap) {
    fake = sourcePair;
  }
  return fake as any
}

const discloseWalkMap = (source: YAMLMap, target: YAMLMap) => {
  const indexList = [] as number[];
  for (const index in source.items) {
    const sourcePair = source.items[index] as any;
    const targetPair = target.items.find((item: any) => {
      return item.key.value === sourcePair.key.value;
    }) || fakePair(sourcePair);
    
    if (sourcePair.value instanceof YAMLSeq && targetPair.value instanceof YAMLSeq) {
      discloseWalkList(sourcePair.value as YAMLSeq, targetPair.value);
    }
    if (sourcePair.value instanceof YAMLMap && targetPair.value instanceof YAMLMap) {
      discloseWalkMap(sourcePair.value, targetPair.value);
    }
    if (sourcePair.key.tag === discloseTag && targetPair.value.value === false) {
      indexList.push(parseInt(index, 10));
    }
  }
  redactSource(source, indexList);
};

const discloseWalkList = (source: YAMLSeq, target: YAMLSeq) => {
  const indexList = [] as number[];
  for (const index in source.items) {
    const sourceElement = source.items[index] as any;
    let targetElement = target.items[index] as any;
    if (sourceElement instanceof YAMLSeq) {
      if (targetElement === undefined || targetElement.value === false) {
        targetElement = fakeSequence(sourceElement.items.length);
      }
      if (targetElement instanceof YAMLSeq) {
        discloseWalkList(sourceElement, targetElement);
      }
    }
    if (sourceElement instanceof YAMLMap) {
      if (targetElement instanceof YAMLMap) {
        discloseWalkMap(sourceElement, targetElement);
      }
    }
    if (sourceElement.tag === discloseTag) {
      if (targetElement.value === false) {
        indexList.push(parseInt(index, 10));
      }
    }
  }

  redactSource(source, indexList);
};

export const redactSource = (source: any, indexList: number[]) => {
  source.items = source.items.filter((_: any, i: number) => {
    discloseReplace(source.items[i]);
    return !indexList.includes(i);
  });
};

const fakeSequence = (length: number) => {
  const fake = new YAMLSeq();
  fake.items = new Array(length).fill({
    value: false,
  });
  return fake;
};

const discloseReplace = (source: Scalar | YAMLSeq | YAMLMap | Pair) => {
  if (
    source instanceof Scalar ||
    source instanceof YAMLSeq ||
    source instanceof YAMLMap
  ) {
    const mutate = source as any;
    delete mutate.toJSON;
    delete mutate.sd;
    delete mutate.tag;
  } else if (source instanceof Pair) {
    const mutate = source as any;
    // indicates performance opportunity...
    if (typeof mutate.key !== 'string'){
      mutate.key.value = `${mutate.key.value}`;
      delete mutate.key.tag;
      delete mutate.value.toJSON;
      delete mutate.value.sd;
      delete mutate.value.tag;
    }
    
  } else {
    console.log(source)
    throw new Error("discloseReplace, Unhandled disclosure case");
  }
};

export const disclose = (source: string, target: string): string => {
  const doc1 = parseCustomTags(source) as any;
  const doc2 = parseCustomTags(target) as any;
  discloseWalkMap(doc1.contents, doc2.contents);
  return stringify(doc1, yamlOptions);
};

