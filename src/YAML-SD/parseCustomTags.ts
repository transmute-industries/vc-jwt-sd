import {
  parseDocument,
  Pair,
  Scalar,
  parse
} from "yaml";

import { walkMap } from "./walkMap";
import { discloseTag } from "./constants";
import {yamlOptions  } from './yamlOptions'

const replacer = (node: any) => {
  // no op
};

export const parseCustomTags = (data: string) => {
  const doc = parseDocument(data, yamlOptions);
  walkMap(doc.contents as any, replacer);
  return doc;
};