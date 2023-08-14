import {
  YAMLMap,
  YAMLSeq,
} from "yaml";
import {walkList} from './walkList'

export const walkMap = (obj: YAMLMap, replacer: any) => {
  for (const pair of obj.items) {
    if (pair.value instanceof YAMLSeq) {
      walkList(pair.value, replacer);
    } else if (pair.value instanceof YAMLMap) {
      walkMap(pair.value, replacer);
    }
    replacer(pair);
  }
};