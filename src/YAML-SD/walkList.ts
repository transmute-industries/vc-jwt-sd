import {
  YAMLMap,
  YAMLSeq,
} from "yaml";

import { walkMap } from "./walkMap";

export const walkList = (list: YAMLSeq, replacer: any) => {
  for (const index in list.items) {
    const element = list.items[index];
    if (element instanceof YAMLSeq) {
      walkList(element, replacer);
    } else if (element instanceof YAMLMap) {
      walkMap(element, replacer);
    }
    replacer(element);
  }
};